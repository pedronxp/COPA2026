// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getUsers, createSandboxUser } from '@/lib/matches-service';
import { requireApiUser } from '@/lib/api-session';

// Obter ranking de usuários
export async function GET() {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Criar competidor dinâmico (Sandbox)
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { name, image } = body;

    if (!name || !image) {
      return NextResponse.json({ error: 'Parâmetros ausentes (name, image).' }, { status: 400 });
    }

    const newUser = await createSandboxUser(name, image);
    return NextResponse.json(newUser);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
