// src/app/api/simulation/reset/route.ts
import { NextResponse } from 'next/server';
import { resetSimulation } from '@/lib/matches-service';

export async function POST() {
  try {
    await resetSimulation();
    return NextResponse.json({ message: 'Simulação reiniciada com sucesso!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
