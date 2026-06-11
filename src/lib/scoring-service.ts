import { Prisma } from '@prisma/client';
import { calculatePredictionPoints } from '@/lib/matches-service';
import { prisma } from '@/lib/prisma';
import {
  getCycleKey,
  publishReadyCyclesForMatch,
} from '@/lib/league-ranking-service';

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
    };
    const newPoints = calculatePredictionPoints(
      prediction.homeGuess,
      prediction.awayGuess,
      match.homeScore,
      match.awayScore,
      rules,
    );
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
            if (delta === 0) return { changed: false, pending: false };

            await tx.leaguePointEntry.update({
              where: { id: existing.id },
              data: { points: newPoints },
            });
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
                },
              },
            });

            if (isGlobal) {
              await tx.user.update({
                where: { id: prediction.userId },
                data: { points: { increment: delta } },
              });
            } else if (existing.status === 'published') {
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
            },
          });

          if (isGlobal) {
            const isHit = newPoints > 0;
            await tx.user.update({
              where: { id: prediction.userId },
              data: {
                points: { increment: newPoints },
                streak: isHit ? { increment: 1 } : 0,
                misses: isHit ? 0 : { increment: 1 },
              },
            });
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
