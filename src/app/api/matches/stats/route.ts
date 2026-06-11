import { NextResponse } from 'next/server';
import { getMatchStats, getMatchStatsBatch } from '@/lib/matches-service';
import { requireApiUser } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';

const PREDICTION_CLOSE_OFFSET_MS = 30 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const matchIds = searchParams
      .get('matchIds')
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 128);
    const leagueId = searchParams.get('leagueId') || 'global';

    if (!matchId && (!matchIds || matchIds.length === 0)) {
      return NextResponse.json(
        { error: 'Parametro matchId ou matchIds e obrigatorio.' },
        { status: 400 },
      );
    }

    if (leagueId !== 'global') {
      const membership = await prisma.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId, userId: auth.user.id } },
        select: { status: true },
      });
      if (!membership || membership.status !== 'active') {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
      }
    }

    if (matchIds && matchIds.length > 0) {
      const matches = await prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: { id: true, kickOff: true },
      });
      const now = Date.now();
      const closedMatchIds = matches
        .filter((match) => now >= match.kickOff.getTime() - PREDICTION_CLOSE_OFFSET_MS)
        .map((match) => match.id);

      const stats = await getMatchStatsBatch(closedMatchIds, leagueId);
      return NextResponse.json(stats);
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId! },
      select: { kickOff: true },
    });
    if (!match) {
      return NextResponse.json({ error: 'Partida nao encontrada.' }, { status: 404 });
    }
    if (Date.now() < match.kickOff.getTime() - PREDICTION_CLOSE_OFFSET_MS) {
      return NextResponse.json(
        { error: 'As estatisticas ficam disponiveis apos o fechamento dos palpites.' },
        { status: 425 },
      );
    }

    const stats = await getMatchStats(matchId!, leagueId);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
