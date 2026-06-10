// src/app/api/predictions/route.ts
import { NextResponse } from 'next/server';
import { getPredictions, savePrediction } from '@/lib/matches-service';

// Obter palpites de um usuário específico
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || 'currentUser';

    const predictions = await getPredictions(userId);
    return NextResponse.json(predictions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Salvar um palpite (com validação do Time Gate de 30 minutos)
// Body: { matchId, homeGuess, awayGuess } — campo "guess" removido (calculado sob demanda)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, homeGuess, awayGuess } = body;
    const userId = request.headers.get('x-user-id') || 'currentUser';

    if (!matchId || homeGuess === undefined || awayGuess === undefined) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    const prediction = await savePrediction(userId, matchId, homeGuess, awayGuess);
    return NextResponse.json(prediction);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 400 }); // 400 para erros de validação como Time Gate
  }
}
