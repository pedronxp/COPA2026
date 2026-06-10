// src/app/api/matches/route.ts
import { NextResponse } from 'next/server';
import { getMatches, updateMatchScore } from '@/lib/matches-service';

// Retornar partidas com filtro opcional por stage e group
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || undefined;
    const group = searchParams.get('group') || undefined;

    const filter = (stage || group) ? { stage, group } : undefined;
    const matches = await getMatches(filter);
    return NextResponse.json(matches);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Atualizar placar de uma partida (usado pelo simulador da Copa)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, homeScore, awayScore, status } = body;

    if (!matchId || homeScore === undefined || awayScore === undefined || !status) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    const updatedMatch = await updateMatchScore(matchId, homeScore, awayScore, status);
    return NextResponse.json(updatedMatch);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
