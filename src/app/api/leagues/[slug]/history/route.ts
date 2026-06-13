import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import { calculatePredictionScore } from '@/lib/scoring-domain';
import { createLeagueSlug } from '@/lib/league-domain';

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { slug } = await params;
    const normalized = slug.trim();

    // 1. Carregar a liga
    const league = await prisma.league.findFirst({
      where: {
        OR: [{ id: normalized }, { slug: createLeagueSlug(normalized) }],
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Bolão não encontrado.' }, { status: 404 });
    }

    // 2. Verificar se o usuário faz parte se for privado
    if (league.visibility === 'private') {
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: league.id,
            userId: auth.user.id,
          },
        },
      });
      if (!membership || membership.status !== 'active') {
        return NextResponse.json({ error: 'Acesso negado. Você não é membro deste bolão.' }, { status: 403 });
      }
    }

    // 3. Buscar os LeaguePointEntry publicados que pontuaram (> 0)
    const pointEntries = await prisma.leaguePointEntry.findMany({
      where: {
        leagueId: league.id,
        status: 'published',
        points: { gt: 0 },
        matchId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        match: true,
        prediction: true,
      },
      orderBy: {
        match: {
          kickOff: 'desc',
        },
      },
    });

    // 4. Agrupar por partida
    const matchesMap: Record<string, {
      match: any;
      winners: Array<{
        userId: string;
        name: string;
        image: string | null;
        totalPoints: number;
        prediction: {
          homeGuess: number;
          awayGuess: number;
        };
        hits: Array<{
          type: 'exact' | 'result' | 'totalGoals' | 'bothTeamsScore';
          label: string;
          points: number;
        }>;
      }>;
    }> = {};

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

    for (const entry of pointEntries) {
      if (
        !entry.match ||
        !entry.prediction ||
        entry.match.homeScore === null ||
        entry.match.awayScore === null
      ) {
        continue;
      }

      const homeScore = entry.match.homeScore;
      const awayScore = entry.match.awayScore;
      const mId = entry.match.id;

      if (!matchesMap[mId]) {
        matchesMap[mId] = {
          match: entry.match,
          winners: [],
        };
      }

      // Re-calcular a quebra de acertos
      const scoreBreakdown = calculatePredictionScore(
        entry.prediction.homeGuess,
        entry.prediction.awayGuess,
        homeScore,
        awayScore,
        rules,
        {
          resultPick: entry.prediction.resultPick as any,
          totalGoalsPick: entry.prediction.totalGoalsPick as any,
          bothTeamsScorePick: entry.prediction.bothTeamsScorePick as any,
        }
      );

      const hits: Array<{
        type: 'exact' | 'result' | 'totalGoals' | 'bothTeamsScore';
        label: string;
        points: number;
      }> = [];

      if (scoreBreakdown.exactScore > 0) {
        hits.push({
          type: 'exact',
          label: 'Placar Exato',
          points: scoreBreakdown.exactScore,
        });
      }
      if (scoreBreakdown.result > 0) {
        let label = 'Vencedor';
        if (homeScore === awayScore) {
          label = 'Empate';
        } else if (
          (entry.prediction.homeGuess > entry.prediction.awayGuess && homeScore > awayScore) ||
          (entry.prediction.homeGuess < entry.prediction.awayGuess && homeScore < awayScore)
        ) {
          label = 'Resultado';
        }
        hits.push({
          type: 'result',
          label,
          points: scoreBreakdown.result,
        });
      }
      if (scoreBreakdown.totalGoals > 0) {
        hits.push({
          type: 'totalGoals',
          label: 'Total de Gols (Over/Under)',
          points: scoreBreakdown.totalGoals,
        });
      }
      if (scoreBreakdown.bothTeamsScore > 0) {
        hits.push({
          type: 'bothTeamsScore',
          label: 'Ambas Marcam',
          points: scoreBreakdown.bothTeamsScore,
        });
      }

      matchesMap[mId].winners.push({
        userId: entry.user.id,
        name: entry.user.name || 'Torcedor',
        image: entry.user.image,
        totalPoints: entry.points,
        prediction: {
          homeGuess: entry.prediction.homeGuess,
          awayGuess: entry.prediction.awayGuess,
        },
        hits,
      });
    }

    // Ordenar os vencedores em cada jogo de forma decrescente por pontos
    const resultList = Object.values(matchesMap).map((mObj) => {
      mObj.winners.sort((a, b) => b.totalPoints - a.totalPoints);
      return mObj;
    });

    // Ordenar as partidas por data de kickOff decrescente
    resultList.sort((a, b) => new Date(b.match.kickOff).getTime() - new Date(a.match.kickOff).getTime());

    return NextResponse.json(resultList);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar histórico da liga.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
