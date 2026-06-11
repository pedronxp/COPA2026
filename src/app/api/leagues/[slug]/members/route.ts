import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import {
  LeagueServiceError,
  changeMemberRole,
  listLeagueMembers,
  parseMemberRole,
  removeLeagueMember,
} from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { slug } = await params;
    return NextResponse.json(await listLeagueMembers(slug, auth.user.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar membros.');
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const [{ slug }, body] = await Promise.all([params, readJsonObject(request)]);
    const targetUserId =
      typeof body.userId === 'string'
        ? body.userId
        : typeof body.targetMemberId === 'string'
          ? body.targetMemberId
          : '';
    if (!targetUserId) {
      throw new LeagueServiceError(
        'O membro alvo e obrigatorio.',
        400,
        'MEMBER_REQUIRED',
      );
    }
    if (body.action === 'remove') {
      return NextResponse.json(
        await removeLeagueMember(slug, auth.user.id, targetUserId),
      );
    }
    return NextResponse.json(
      await changeMemberRole(
        slug,
        auth.user.id,
        targetUserId,
        parseMemberRole(body.role),
      ),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao gerenciar membro.');
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { slug } = await params;
    const targetUserId = new URL(request.url).searchParams.get('userId') || '';
    if (!targetUserId) {
      throw new LeagueServiceError(
        'O membro alvo e obrigatorio.',
        400,
        'MEMBER_REQUIRED',
      );
    }
    return NextResponse.json(
      await removeLeagueMember(slug, auth.user.id, targetUserId),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao remover membro.');
  }
}

export const PUT = PATCH;
