// src/app/api/predictions/route.ts
import { NextResponse } from 'next/server';
import { getPredictions } from '@/lib/matches-service';
import { saveLeaguePrediction } from '@/lib/prediction-service';
import { requireApiUser } from '@/lib/api-session';

// Obter palpites de um usuário específico em um bolão, ou de todos os membros caso a partida esteja fechada
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId') || undefined;
    const matchId = searchParams.get('matchId') || undefined;
    const targetUserId = searchParams.get('targetUserId') || undefined;

    if (targetUserId && leagueId) {
      if (leagueId !== 'global') {
        const membership = await prisma.leagueMember.findUnique({
          where: { leagueId_userId: { leagueId, userId: auth.user.id } },
          select: { status: true }
        });
        if (!membership || membership.status !== 'active') {
          return NextResponse.json({ error: 'Acesso negado. Você não é membro ativo deste bolão.' }, { status: 403 });
        }
      }

      const predictions = await prisma.prediction.findMany({
        where: { leagueId, userId: targetUserId },
        include: {
          match: true,
          pointEntry: true
        },
        orderBy: {
          match: {
            kickOff: 'asc'
          }
        }
      });

      const now = Date.now();

      const results = predictions.map(p => {
        const kickOffTime = p.match.kickOff.getTime();
        const limitTime = kickOffTime - 30 * 60 * 1000;
        const isClosed = p.match.status !== 'scheduled' || now > limitTime;

        if (targetUserId !== auth.user.id && !isClosed) {
          return {
            id: p.id,
            matchId: p.matchId,
            match: {
              homeTeam: p.match.homeTeam,
              awayTeam: p.match.awayTeam,
              homeFlag: p.match.homeFlag,
              awayFlag: p.match.awayFlag,
              homeTeamLogo: p.match.homeTeamLogo,
              awayTeamLogo: p.match.awayTeamLogo,
              kickOff: p.match.kickOff,
              status: p.match.status,
              stage: p.match.stage,
              group: p.match.group,
              homeScore: null,
              awayScore: null
            },
            homeGuess: null,
            awayGuess: null,
            resultPick: null,
            totalGoalsPick: null,
            bothTeamsScorePick: null,
            points: null,
            isClosed: false
          };
        }

        return {
          id: p.id,
          matchId: p.matchId,
          match: p.match,
          homeGuess: p.homeGuess,
          awayGuess: p.awayGuess,
          resultPick: p.resultPick,
          totalGoalsPick: p.totalGoalsPick,
          bothTeamsScorePick: p.bothTeamsScorePick,
          points: p.pointEntry?.points ?? (isClosed ? 0 : null),
          isClosed: true
        };
      });

      return NextResponse.json(results);
    }

    if (matchId && leagueId) {
      // 1. Verificar filiação do usuário logado na liga
      if (leagueId !== 'global') {
        const membership = await prisma.leagueMember.findUnique({
          where: { leagueId_userId: { leagueId, userId: auth.user.id } },
          select: { status: true }
        });
        if (!membership || membership.status !== 'active') {
          return NextResponse.json({ error: 'Acesso negado. Você não é membro ativo deste bolão.' }, { status: 403 });
        }
      }

      // 2. Buscar a partida para validar o Time Gate
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { kickOff: true, status: true }
      });
      if (!match) {
        return NextResponse.json({ error: 'Partida não encontrada.' }, { status: 404 });
      }

      const now = Date.now();
      const limitTime = match.kickOff.getTime() - 30 * 60 * 1000;
      const isClosed = match.status !== 'scheduled' || now > limitTime;

      if (!isClosed) {
        return NextResponse.json({
          error: 'Os palpites dos outros membros só ficarão visíveis após o encerramento dos palpites (30 minutos antes do início do jogo).',
          isClosed: false,
          predictions: []
        }, { status: 425 });
      }

      // 3. Buscar os membros da liga e os palpites deles para a partida
      const members = await prisma.leagueMember.findMany({
        where: { leagueId, status: 'active' },
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        },
        orderBy: { points: 'desc' }
      });

      const predictions = await prisma.prediction.findMany({
        where: { matchId, leagueId },
        include: {
          pointEntry: true
        }
      });

      const predictionsMap = new Map(predictions.map(p => [p.userId, p]));

      const results = members.map(m => {
        const pred = predictionsMap.get(m.userId);
        return {
          userId: m.userId,
          name: m.user.name || 'Competidor',
          image: m.user.image,
          role: m.role,
          hasPrediction: !!pred,
          homeGuess: pred?.homeGuess ?? null,
          awayGuess: pred?.awayGuess ?? null,
          resultPick: pred?.resultPick ?? null,
          totalGoalsPick: pred?.totalGoalsPick ?? null,
          bothTeamsScorePick: pred?.bothTeamsScorePick ?? null,
          points: pred?.pointEntry?.points ?? (pred ? 0 : null),
        };
      });

      return NextResponse.json({
        isClosed: true,
        predictions: results
      });
    }

    const predictions = await getPredictions(auth.user.id, leagueId);
    return NextResponse.json(predictions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Salvar um palpite (com validação do Time Gate e limites de edição no matches-service)
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const body = await request.json();
    const {
      matchId,
      homeGuess,
      awayGuess,
      resultPick,
      totalGoalsPick,
      bothTeamsScorePick,
      leagueId = 'global',
    } = body;

    if (
      !matchId ||
      homeGuess === undefined ||
      awayGuess === undefined ||
      resultPick === undefined ||
      totalGoalsPick === undefined ||
      bothTeamsScorePick === undefined
    ) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    const prediction = await saveLeaguePrediction({
      userId: auth.user.id,
      matchId,
      homeGuess,
      awayGuess,
      resultPick,
      totalGoalsPick,
      bothTeamsScorePick,
      leagueId,
    });
    return NextResponse.json(prediction);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 400 }); // 400 para erros de validação como Time Gate ou Edições excedidas
  }
}
