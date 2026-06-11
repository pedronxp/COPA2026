// src/app/api/simulation/reset/route.ts
import { NextResponse } from 'next/server';
import { resetSimulation } from '@/lib/matches-service';
import { requireOperationalRequest } from '@/lib/operational-auth';

export async function POST(request: Request) {
  try {
    const forbidden = await requireOperationalRequest(request, 'matches:operate');
    if (forbidden) return forbidden;

    await resetSimulation();
    return NextResponse.json({ message: 'Simulação reiniciada com sucesso!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
