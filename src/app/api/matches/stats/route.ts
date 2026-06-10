// src/app/api/matches/stats/route.ts
import { NextResponse } from 'next/server';
import { getMatchStats } from '@/lib/matches-service';

// GET: Retorna porcentagem de palpites (casa/empate/fora) de uma partida
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'Parâmetro matchId é obrigatório.' },
        { status: 400 }
      );
    }

    const stats = await getMatchStats(matchId);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
