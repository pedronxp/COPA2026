// src/app/api/leagues/join/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/lib/matches-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'currentUser';
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: 'O código de convite é obrigatório.' }, { status: 400 });
    }

    const inviteCodeNorm = inviteCode.toUpperCase().trim();

    await ensureUserExists(userId);

    // Buscar bolão
    const league = await prisma.league.findUnique({
      where: { inviteCode: inviteCodeNorm },
    });

    if (!league) {
      return NextResponse.json({ error: 'Bolão não encontrado. Verifique o código digitado.' }, { status: 404 });
    }

    // Verificar se já é membro
    const existing = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId,
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Você já faz parte deste bolão.' }, { status: 400 });
    }

    // Adicionar membro
    await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId,
        role: 'member',
        points: 0,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Você entrou no bolão "${league.name}" com sucesso!`,
      league,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao entrar no bolão.' }, { status: 500 });
  }
}
