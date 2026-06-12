// src/app/api/matches/route.ts
import { NextResponse } from 'next/server';
import { getMatches, updateMatchScore } from '@/lib/matches-service';
import { requireApiUser } from '@/lib/api-session';
import { requireOperationalRequest } from '@/lib/operational-auth';

// Retornar partidas com filtro opcional por stage e group
export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

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
    const forbidden = await requireOperationalRequest(request, 'matches:operate');
    if (forbidden) return forbidden;

    const body = await request.json();
    const { matchId, homeScore, awayScore, status } = body;

    if (!matchId || homeScore === undefined || awayScore === undefined || !status) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    const updatedMatch = await updateMatchScore(matchId, homeScore, awayScore, status);

    // Revalidar caminhos do Next.js para garantir atualização imediata das telas do jogador e do admin
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/dashboard');
      revalidatePath('/matches');
      revalidatePath('/');
      revalidatePath('/results');
      revalidatePath('/calendar');
      revalidatePath('/leaderboard');
      revalidatePath('/admin/matches');
    } catch (err) {
      console.error('Falha ao revalidar caminhos via API de matches:', err);
    }

    return NextResponse.json(updatedMatch);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
