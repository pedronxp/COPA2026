import { prisma } from '@/lib/prisma';
import {
  isResultPick,
  isTotalGoalsPick,
  isBothTeamsScorePick,
} from '@/lib/prediction-markets';

export async function saveLeaguePrediction(input: {
  userId: string;
  matchId: string;
  leagueId?: string;
  homeGuess: number;
  awayGuess: number;
  resultPick: unknown;
  totalGoalsPick: unknown;
  bothTeamsScorePick: unknown;
}) {
  const {
    userId,
    matchId,
    leagueId = 'global',
    homeGuess,
    awayGuess,
    resultPick,
    totalGoalsPick,
    bothTeamsScorePick,
  } = input;

  if (
    !Number.isInteger(homeGuess) ||
    !Number.isInteger(awayGuess) ||
    homeGuess < 0 ||
    awayGuess < 0 ||
    homeGuess > 99 ||
    awayGuess > 99
  ) {
    throw new Error('O placar deve conter números inteiros entre 0 e 99.');
  }

  const [league, match] = await Promise.all([
    prisma.league.findUnique({ where: { id: leagueId } }),
    prisma.match.findUnique({ where: { id: matchId } }),
  ]);
  if (!league) throw new Error('Bolão não encontrado.');
  if (!match) throw new Error('Partida não encontrada.');

  // Validação dinâmica com base nas regras de pontuação do bolão
  const isResultRequired =
    (league.pointsWinner ?? 0) > 0 ||
    (league.pointsWinnerHome ?? 0) > 0 ||
    (league.pointsWinnerAway ?? 0) > 0 ||
    (league.pointsDraw ?? 0) > 0;
  const isTotalGoalsRequired = (league.pointsDiff ?? 0) > 0;
  const isBothTeamsScoreRequired =
    (league.pointsBothScoreYes ?? 0) > 0 || (league.pointsBothScoreNo ?? 0) > 0;

  let validatedResultPick: string | null = null;
  let validatedTotalGoalsPick: string | null = null;
  let validatedBothTeamsScorePick: string | null = null;

  if (isResultRequired) {
    if (!isResultPick(resultPick)) {
      throw new Error('Escolha o resultado: casa vence, empate ou fora vence.');
    }
    validatedResultPick = resultPick;
  } else {
    validatedResultPick = isResultPick(resultPick) ? resultPick : null;
  }

  if (isTotalGoalsRequired) {
    if (!isTotalGoalsPick(totalGoalsPick)) {
      throw new Error('Escolha uma opção válida de total de gols.');
    }
    validatedTotalGoalsPick = totalGoalsPick;
  } else {
    validatedTotalGoalsPick = isTotalGoalsPick(totalGoalsPick) ? totalGoalsPick : null;
  }

  if (isBothTeamsScoreRequired) {
    if (!isBothTeamsScorePick(bothTeamsScorePick)) {
      throw new Error('Escolha se ambas marcam: sim ou não.');
    }
    validatedBothTeamsScorePick = bothTeamsScorePick;
  } else {
    validatedBothTeamsScorePick = isBothTeamsScorePick(bothTeamsScorePick) ? bothTeamsScorePick : null;
  }

  if (league.status !== 'active' || league.expiresAt <= new Date()) {
    throw new Error('Este bolão não está aceitando novos palpites.');
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  if (!membership || membership.status !== 'active') {
    throw new Error('Você precisa participar deste bolão antes de palpitar.');
  }

  const now = Date.now();
  const openTime = match.kickOff.getTime() - league.windowHours * 60 * 60 * 1000;
  const limitTime = match.kickOff.getTime() - 30 * 60 * 1000;
  if (match.status !== 'scheduled' || now > limitTime) {
    throw new Error('Palpites fechados para esta partida.');
  }
  if (now < openTime) {
    throw new Error(`Palpites abrem ${league.windowHours} horas antes do início.`);
  }

  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.prediction.findUnique({
        where: { userId_matchId_leagueId: { userId, matchId, leagueId } },
      });

      if (!existing) {
        const prediction = await tx.prediction.create({
          data: {
            userId,
            matchId,
            leagueId,
            homeGuess,
            awayGuess,
            resultPick: validatedResultPick,
            totalGoalsPick: validatedTotalGoalsPick,
            bothTeamsScorePick: validatedBothTeamsScorePick,
          },
        });
        await tx.league.updateMany({
          where: { id: leagueId, rulesLockedAt: null },
          data: { rulesLockedAt: new Date() },
        });
        return prediction;
      }

      if (existing.processed) throw new Error('Este palpite já foi pontuado.');
      if (existing.editCount >= league.maxEdits) {
        throw new Error(`Limite de edições (${league.maxEdits}) atingido.`);
      }

      const result = await tx.prediction.updateMany({
        where: {
          id: existing.id,
          processed: false,
          editCount: existing.editCount,
        },
        data: {
          homeGuess,
          awayGuess,
          resultPick: validatedResultPick,
          totalGoalsPick: validatedTotalGoalsPick,
          bothTeamsScorePick: validatedBothTeamsScorePick,
          editCount: { increment: 1 },
        },
      });
      if (result.count !== 1) {
        throw new Error('O palpite mudou em outra sessão. Atualize e tente novamente.');
      }
      return tx.prediction.findUniqueOrThrow({ where: { id: existing.id } });
    },
    { isolationLevel: 'Serializable' },
  );
}
