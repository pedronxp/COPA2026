// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getUsers, createSandboxUser } from '@/lib/matches-service';

// Obter ranking de usuários
export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Criar competidor dinâmico (Sandbox)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, image } = body;

    if (!name || !image) {
      return NextResponse.json({ error: 'Parâmetros ausentes (name, image).' }, { status: 400 });
    }

    const newUser = await createSandboxUser(name, image);
    return NextResponse.json(newUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
