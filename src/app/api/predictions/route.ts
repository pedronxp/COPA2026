// src/app/api/predictions/route.ts
import { NextResponse } from 'next/server';
import { getPredictions } from '@/lib/matches-service';
import { saveLeaguePrediction } from '@/lib/prediction-service';
import { requireApiUser } from '@/lib/api-session';

// Obter palpites de um usuário específico em um bolão
export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId') || undefined;

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
