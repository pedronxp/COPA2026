import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import {
  LeagueServiceError,
  transferLeagueOwnership,
} from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Context) {
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
        'O novo dono e obrigatorio.',
        400,
        'MEMBER_REQUIRED',
      );
    }
    return NextResponse.json(
      await transferLeagueOwnership(slug, auth.user.id, targetUserId),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao transferir propriedade.');
  }
}
