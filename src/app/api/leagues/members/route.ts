import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import { prisma } from '@/lib/prisma';
import {
  changeMemberRole,
  listLeagueMembers,
  parseMemberRole,
  removeLeagueMember,
} from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../_shared';

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const reference =
      searchParams.get('leagueId') || searchParams.get('slug') || '';

    if (reference === 'global') {
      const users = await prisma.user.findMany({
        where: { NOT: { id: 'system' } },
        orderBy: [{ points: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          points: true,
          streak: true,
          misses: true,
        },
      });
      return NextResponse.json(
        users.map((user) => ({ ...user, name: user.name || 'Usuario', role: 'member' })),
      );
    }

    return NextResponse.json(
      await listLeagueMembers(reference, auth.user.id),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar membros.');
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const body = await readJsonObject(request);
    const reference =
      typeof body.leagueId === 'string'
        ? body.leagueId
        : typeof body.slug === 'string'
          ? body.slug
          : '';
    const targetUserId =
      typeof body.targetMemberId === 'string'
        ? body.targetMemberId
        : typeof body.userId === 'string'
          ? body.userId
          : '';

    if (body.action === 'remove') {
      return NextResponse.json(
        await removeLeagueMember(reference, auth.user.id, targetUserId),
      );
    }

    const role = parseMemberRole(body.role);
    return NextResponse.json(
      await changeMemberRole(reference, auth.user.id, targetUserId, role),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao gerenciar membro.');
  }
}

export const PUT = PATCH;
