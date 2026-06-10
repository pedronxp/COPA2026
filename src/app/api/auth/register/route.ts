// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, image } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    // Normalizar e-mail
    const emailNorm = email.toLowerCase().trim();

    // Verificar se já existe usuário
    const existing = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // Criar o usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        name: name || 'Torcedor',
        email: emailNorm,
        passwordHash,
        image: image || '⚽',
        points: 0,
      },
    });

    // Inserir automaticamente o usuário como membro do bolão global
    // Primeiro verifica se o bolão global existe (caso contrário o seed não rodou)
    let globalLeague = await prisma.league.findUnique({ where: { id: 'global' } });
    if (!globalLeague) {
      // Se não existir por algum motivo, cria
      globalLeague = await prisma.league.create({
        data: {
          id: 'global',
          name: 'Bolão Global da Copa',
          description: 'O bolão oficial da plataforma para todos os torcedores.',
          inviteCode: 'COPA-GLOBAL',
          ownerId: user.id, // define temporariamente como dono
          expiresAt: new Date('2026-08-01T00:00:00Z'),
        }
      });
    }

    // Vincular usuário ao bolão global
    await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: { leagueId: 'global', userId: user.id }
      },
      update: {},
      create: {
        leagueId: 'global',
        userId: user.id,
        role: 'member',
        points: 0,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        points: user.points,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no cadastro.' }, { status: 500 });
  }
}
