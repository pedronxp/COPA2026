// src/app/api/leagues/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/lib/matches-service';

// 1. Listar os bolões de um usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || request.headers.get('x-user-id') || 'currentUser';
    
    await ensureUserExists(userId);

    // Buscar os bolões em que o usuário é membro
    const memberships = await prisma.leagueMember.findMany({
      where: { userId },
      include: {
        league: {
          include: {
            owner: {
              select: { id: true, name: true, image: true }
            },
            _count: {
              select: { members: true }
            }
          }
        }
      },
      orderBy: { league: { createdAt: 'desc' } }
    });

    const leagues = await Promise.all(memberships.map(async m => {
      // Buscar o maior pontuador do bolão para saber quem é o líder
      const leader = await prisma.leagueMember.findFirst({
        where: { leagueId: m.league.id },
        orderBy: { points: 'desc' },
        select: { userId: true, points: true }
      });

      const isUserLeader = leader ? (leader.userId === userId && leader.points > 0) : false;

      // Calcular a posição (ranking) do competidor neste bolão específico
      const userRank = await prisma.leagueMember.count({
        where: {
          leagueId: m.league.id,
          points: {
            gt: m.points
          }
        }
      }) + 1;

      return {
        id: m.league.id,
        name: m.league.name,
        description: m.league.description,
        inviteCode: m.league.inviteCode,
        ownerId: m.league.ownerId,
        ownerName: m.league.owner.name,
        ownerImage: m.league.owner.image,
        expiresAt: m.league.expiresAt,
        windowHours: m.league.windowHours,
        maxEdits: m.league.maxEdits,
        pointsExact: m.league.pointsExact,
        pointsDiff: m.league.pointsDiff,
        pointsWinner: m.league.pointsWinner,
        pointsDraw: m.league.pointsDraw,
        createdAt: m.league.createdAt,
        memberCount: m.league._count.members,
        userRole: m.role,
        userPoints: m.points, // pontos do usuário específico neste bolão
        userRank,             // posição/ranking do usuário no bolão
        isUserLeader,
        leaderPoints: leader ? leader.points : 0
      };
    }));

    return NextResponse.json(leagues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar bolões.' }, { status: 500 });
  }
}

// 2. Criar um bolão customizado
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'currentUser';
    
    const {
      name,
      description,
      expiresAt,
      windowHours = 48,
      maxEdits = 3,
      pointsExact = 5,
      pointsDiff = 3,
      pointsWinner = 2,
      pointsDraw = 2
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'O nome do bolão é obrigatório.' }, { status: 400 });
    }

    await ensureUserExists(userId);

    // Gerar código de convite único
    let inviteCode = '';
    let isUnique = false;
    while (!isUnique) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      inviteCode = `COPA-${code}`;
      
      const existing = await prisma.league.findUnique({ where: { inviteCode } });
      if (!existing) isUnique = true;
    }

    // Criar o bolão
    const league = await prisma.league.create({
      data: {
        name,
        description,
        inviteCode,
        ownerId: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date('2026-08-01T00:00:00Z'),
        windowHours: Number(windowHours),
        maxEdits: Number(maxEdits),
        pointsExact: Number(pointsExact),
        pointsDiff: Number(pointsDiff),
        pointsWinner: Number(pointsWinner),
        pointsDraw: Number(pointsDraw),
      }
    });

    // Inserir o criador como membro com role 'owner'
    await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId,
        role: 'owner',
        points: 0,
      }
    });

    return NextResponse.json(league);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar bolão.' }, { status: 500 });
  }
}

// 3. Atualizar configurações ou gerenciar membros do bolão (apenas donos/subadmins)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'currentUser';
    
    const {
      leagueId,
      name,
      description,
      windowHours,
      maxEdits,
      pointsExact,
      pointsDiff,
      pointsWinner,
      pointsDraw,
      expiresAt,
      // Gerenciamento de membros
      targetMemberId,
      action // 'promote' | 'demote' | 'remove'
    } = body;

    if (!leagueId) {
      return NextResponse.json({ error: 'O ID do bolão é obrigatório.' }, { status: 400 });
    }

    // Validar se o usuário é dono ou subadmin
    const userMember = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } }
    });

    if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'subadmin')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas o criador ou subadministradores podem gerenciar o bolão.' }, { status: 403 });
    }

    // Se a ação for de gerenciamento de membros
    if (targetMemberId && action) {
      const targetMember = await prisma.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId, userId: targetMemberId } }
      });

      if (!targetMember) {
        return NextResponse.json({ error: 'Membro não encontrado no bolão.' }, { status: 404 });
      }

      // Validações de privilégio
      if (userMember.role === 'subadmin' && targetMember.role === 'owner') {
        return NextResponse.json({ error: 'Subadministradores não podem gerenciar o dono do bolão.' }, { status: 403 });
      }
      if (userMember.role === 'subadmin' && targetMember.role === 'subadmin' && action !== 'remove') {
        return NextResponse.json({ error: 'Subadministradores não podem alterar o cargo de outros subadministradores.' }, { status: 403 });
      }

      if (action === 'promote') {
        await prisma.leagueMember.update({
          where: { leagueId_userId: { leagueId, userId: targetMemberId } },
          data: { role: 'subadmin' }
        });
        return NextResponse.json({ success: true, message: 'Membro promovido a subadministrador.' });
      } else if (action === 'demote') {
        await prisma.leagueMember.update({
          where: { leagueId_userId: { leagueId, userId: targetMemberId } },
          data: { role: 'member' }
        });
        return NextResponse.json({ success: true, message: 'Cargo alterado para membro comum.' });
      } else if (action === 'remove') {
        if (targetMember.role === 'owner') {
          return NextResponse.json({ error: 'O dono do bolão não pode ser removido.' }, { status: 403 });
        }
        await prisma.leagueMember.delete({
          where: { leagueId_userId: { leagueId, userId: targetMemberId } }
        });
        return NextResponse.json({ success: true, message: 'Membro removido do bolão.' });
      }
    }

    // Caso contrário, atualiza as regras/dados do bolão
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (windowHours !== undefined) updateData.windowHours = Number(windowHours);
    if (maxEdits !== undefined) updateData.maxEdits = Number(maxEdits);
    if (pointsExact !== undefined) updateData.pointsExact = Number(pointsExact);
    if (pointsDiff !== undefined) updateData.pointsDiff = Number(pointsDiff);
    if (pointsWinner !== undefined) updateData.pointsWinner = Number(pointsWinner);
    if (pointsDraw !== undefined) updateData.pointsDraw = Number(pointsDraw);
    if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt);

    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: updateData
    });

    return NextResponse.json(updatedLeague);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar bolão.' }, { status: 500 });
  }
}
