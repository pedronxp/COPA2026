import { Prisma } from '@prisma/client';
import { calculatePredictionScore } from '@/lib/scoring-domain';
import { prisma } from '@/lib/prisma';
import {
  getCycleKey,
  publishReadyCyclesForMatch,
} from '@/lib/league-ranking-service';

export function summarizeGlobalPerformance(rows: Array<{ points: number }>) {
  let points = 0;
  let streak = 0;
  let misses = 0;

  for (const row of rows) {
    points += row.points;
    if (row.points > 0) {
      streak += 1;
      misses = 0;
    } else {
      streak = 0;
      misses += 1;
    }
  }

  return { points, streak, misses };
}

async function recomputeGlobalPerformance(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const predictions = await tx.prediction.findMany({
    where: {
      leagueId: 'global',
      userId,
      processed: true,
      match: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      pointEntry: { isNot: null },
    },
    orderBy: { match: { kickOff: 'asc' } },
    select: {
      pointEntry: { select: { points: true } },
    },
  });
  const summary = summarizeGlobalPerformance(
    predictions.map((prediction) => ({
      points: prediction.pointEntry?.points ?? 0,
    })),
  );

  await tx.user.update({
    where: { id: userId },
    data: summary,
  });
}

async function recomputeExactScoreStreak(
  tx: Prisma.TransactionClient,
  leagueId: string,
  userId: string,
) {
  const predictions = await tx.prediction.findMany({
    where: {
      leagueId,
      userId,
      processed: true,
      match: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
    },
    orderBy: { match: { kickOff: 'asc' } },
    select: {
      homeGuess: true,
      awayGuess: true,
      match: { select: { homeScore: true, awayScore: true } },
    },
  });

  let current = 0;
  let best = 0;
  for (const prediction of predictions) {
    const exact =
      prediction.homeGuess === prediction.match.homeScore &&
      prediction.awayGuess === prediction.match.awayScore;
    current = exact ? current + 1 : 0;
    best = Math.max(best, current);
  }

  await tx.leagueMember.updateMany({
    where: { leagueId, userId },
    data: {
      exactScoreStreak: current,
      bestExactScoreStreak: best,
    },
  });
}

export async function processLeagueScoringForMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.homeScore === null || match.awayScore === null) return;

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: { league: true, pointEntry: true },
  });
  const affectedLeagueIds: string[] = [];

  for (const prediction of predictions) {
    const rules = {
      pointsExact: prediction.league.pointsExact,
      pointsDiff: prediction.league.pointsDiff,
      pointsWinner: prediction.league.pointsWinner,
      pointsWinnerHome: prediction.league.pointsWinnerHome,
      pointsWinnerAway: prediction.league.pointsWinnerAway,
      pointsDraw: prediction.league.pointsDraw,
      pointsBothScoreYes: prediction.league.pointsBothScoreYes,
      pointsBothScoreNo: prediction.league.pointsBothScoreNo,
    };
    const score = calculatePredictionScore(
      prediction.homeGuess,
      prediction.awayGuess,
      match.homeScore,
      match.awayScore,
      rules,
    );
    const newPoints = score.total;
    const cycleKey = getCycleKey(prediction.league, match);
    const isGlobal = prediction.leagueId === 'global';
    const publishImmediately =
      isGlobal ||
      (match.stage === 'group'
        ? prediction.league.groupPublicationMode === 'match'
        : prediction.league.knockoutPublicationMode === 'match');

    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.leaguePointEntry.findUnique({
            where: { predictionId: prediction.id },
          });

          if (existing) {
            const delta = newPoints - existing.points;
            await tx.leaguePointEntry.update({
              where: { id: existing.id },
              data: {
                points: newPoints,
                metadata: {
                  score: score as unknown as Prisma.InputJsonValue,
                  prediction: {
                    home: prediction.homeGuess,
                    away: prediction.awayGuess,
                  },
                  result: { home: match.homeScore, away: match.awayScore },
                },
              },
            });
            await recomputeExactScoreStreak(
              tx,
              prediction.leagueId,
              prediction.userId,
            );
            if (isGlobal) {
              await recomputeGlobalPerformance(tx, prediction.userId);
            }
            if (delta === 0) return { changed: false, pending: false };

            await tx.leaguePointEntry.create({
              data: {
                leagueId: prediction.leagueId,
                userId: prediction.userId,
                matchId,
                points: delta,
                status: existing.status,
                kind: 'correction',
                stage: match.stage,
                matchday: match.matchday,
                cycleKey,
                publishedAt: existing.publishedAt,
                metadata: {
                  predictionId: prediction.id,
                  previousPoints: existing.points,
                  correctedPoints: newPoints,
                  score: score as unknown as Prisma.InputJsonValue,
                },
              },
            });

            if (!isGlobal) {
              if (existing.status === 'published') {
                await tx.leagueMember.update({
                  where: {
                    leagueId_userId: {
                      leagueId: prediction.leagueId,
                      userId: prediction.userId,
                    },
                  },
                  data: { points: { increment: delta } },
                });
              } else {
                await tx.leagueMember.update({
                  where: {
                    leagueId_userId: {
                      leagueId: prediction.leagueId,
                      userId: prediction.userId,
                    },
                  },
                  data: { pendingPoints: { increment: delta } },
                });
              }
            }
            return { changed: true, pending: existing.status === 'pending' };
          }

          const claimed = await tx.prediction.updateMany({
            where: { id: prediction.id, processed: false },
            data: { processed: true },
          });
          if (claimed.count !== 1) return { changed: false, pending: false };

          await tx.leaguePointEntry.create({
            data: {
              leagueId: prediction.leagueId,
              userId: prediction.userId,
              predictionId: prediction.id,
              matchId,
              points: newPoints,
              status: publishImmediately ? 'published' : 'pending',
              stage: match.stage,
              matchday: match.matchday,
              cycleKey,
              publishedAt: publishImmediately ? new Date() : null,
              metadata: {
                score: score as unknown as Prisma.InputJsonValue,
                prediction: {
                  home: prediction.homeGuess,
                  away: prediction.awayGuess,
                },
                result: { home: match.homeScore, away: match.awayScore },
              },
            },
          });

          await recomputeExactScoreStreak(
            tx,
            prediction.leagueId,
            prediction.userId,
          );

          if (isGlobal) {
            await recomputeGlobalPerformance(tx, prediction.userId);
          } else if (publishImmediately) {
            await tx.leagueMember.update({
              where: {
                leagueId_userId: {
                  leagueId: prediction.leagueId,
                  userId: prediction.userId,
                },
              },
              data: { points: { increment: newPoints } },
            });
          } else {
            await tx.leagueMember.update({
              where: {
                leagueId_userId: {
                  leagueId: prediction.leagueId,
                  userId: prediction.userId,
                },
              },
              data: { pendingPoints: { increment: newPoints } },
            });
          }
          return { changed: true, pending: !publishImmediately };
        },
        { isolationLevel: 'Serializable' },
      );
      if (result.pending) affectedLeagueIds.push(prediction.leagueId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        continue;
      }
      throw error;
    }
  }

  await publishReadyCyclesForMatch(match, affectedLeagueIds);
}
