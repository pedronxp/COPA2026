import { prisma } from '@/lib/prisma';
import { calculatePredictionScore } from '@/lib/scoring-domain';
import { normalizePredictionMarketPicks } from '@/lib/prediction-markets';
import { Prisma } from '@prisma/client';

/**
 * Recalcula retroativamente todas as pontuações e saldos do bolão
 * quando o dono altera as regras de pontuação (presets/pontos).
 */
export async function recomputeLeagueScoring(tx: Prisma.TransactionClient, leagueId: string) {
  const league = await tx.league.findUniqueOrThrow({
    where: { id: leagueId }
  });

  // 1. Buscar todas as predictions do bolão que pertencem a partidas finalizadas
  const predictions = await tx.prediction.findMany({
    where: {
      leagueId,
      match: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null }
      }
    },
    include: {
      match: true,
      pointEntry: true
    }
  });

  const rules = {
    pointsExact: league.pointsExact,
    pointsDiff: league.pointsDiff,
    pointsWinner: league.pointsWinner,
    pointsWinnerHome: league.pointsWinnerHome,
    pointsWinnerAway: league.pointsWinnerAway,
    pointsDraw: league.pointsDraw,
    pointsBothScoreYes: league.pointsBothScoreYes,
    pointsBothScoreNo: league.pointsBothScoreNo,
  };

  // 2. Atualizar a pontuação de cada prediction no LeaguePointEntry
  for (const prediction of predictions) {
    const marketPicks = normalizePredictionMarketPicks(prediction);
    const score = calculatePredictionScore(
      prediction.homeGuess,
      prediction.awayGuess,
      prediction.match.homeScore!,
      prediction.match.awayScore!,
      rules,
      marketPicks
    );
    const newPoints = score.total;

    if (prediction.pointEntry) {
      await tx.leaguePointEntry.update({
        where: { id: prediction.pointEntry.id },
        data: {
          points: newPoints,
          metadata: {
            score: score as any,
            prediction: {
              home: prediction.homeGuess,
              away: prediction.awayGuess,
              resultPick: marketPicks.resultPick,
              totalGoalsPick: marketPicks.totalGoalsPick,
              bothTeamsScorePick: marketPicks.bothTeamsScorePick,
            },
            result: { home: prediction.match.homeScore, away: prediction.match.awayScore }
          }
        }
      });
    }
  }

  // 3. Recalcular os pontos totais e pendentes de cada membro do bolão
  const members = await tx.leagueMember.findMany({
    where: { leagueId, status: 'active' }
  });

  for (const member of members) {
    const publishedSum = await tx.leaguePointEntry.aggregate({
      where: {
        leagueId,
        userId: member.userId,
        status: 'published'
      },
      _sum: { points: true }
    });

    const pendingSum = await tx.leaguePointEntry.aggregate({
      where: {
        leagueId,
        userId: member.userId,
        status: 'pending'
      },
      _sum: { points: true }
    });

    await tx.leagueMember.update({
      where: { id: member.id },
      data: {
        points: publishedSum._sum.points || 0,
        pendingPoints: pendingSum._sum.points || 0
      }
    });
  }
}
