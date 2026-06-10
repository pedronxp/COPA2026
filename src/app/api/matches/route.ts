// src/app/api/matches/route.ts
import { NextResponse } from 'next/server';
import { getMatches, updateMatchScore } from '@/lib/matches-service';

// Retornar todas as partidas
export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json(matches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
