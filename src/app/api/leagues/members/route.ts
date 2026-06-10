// src/app/api/leagues/members/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ error: 'O ID do bolão é obrigatório.' }, { status: 400 });
    }

    if (leagueId === 'global') {
      // Retorna todos os usuários ordenados por pontos (ranking global)
      const dbUsers = await prisma.user.findMany({
        where: {
          NOT: { id: 'system' }
        },
        orderBy: { points: 'desc' },
      });

      const users = dbUsers.map(u => ({
        id: u.id,
        name: u.name || 'Usuário',
        email: u.email,
        image: u.image || '👤',
        points: u.points,
        streak: u.streak,
        misses: u.misses,
        role: 'member',
      }));

      return NextResponse.json(users);
    }

    // Buscar membros do bolão customizado
    const members = await prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            streak: true,
            misses: true,
          }
        }
      },
      orderBy: { points: 'desc' },
    });

    const formatted = members.map(m => ({
      id: m.userId,
      name: m.user.name || 'Usuário',
      email: m.user.email,
      image: m.user.image || '👤',
      points: m.points, // pontos acumulados NESTE bolão
      streak: m.user.streak,
      misses: m.user.misses,
      role: m.role, // 'owner' | 'subadmin' | 'member'
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar membros.' }, { status: 500 });
  }
}
