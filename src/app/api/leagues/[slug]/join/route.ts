import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import { joinLeague } from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const [{ slug }, body] = await Promise.all([
      params,
      readJsonObject(request, true),
    ]);
    const result = await joinLeague(auth.user.id, {
      reference: slug,
      inviteCode:
        typeof body.inviteCode === 'string' ? body.inviteCode : undefined,
    });
    return NextResponse.json(result, {
      status: result.outcome === 'pending' ? 202 : 200,
    });
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao entrar no bolão.');
  }
}
