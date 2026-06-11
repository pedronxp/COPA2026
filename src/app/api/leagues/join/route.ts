import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import { joinLeague } from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../_shared';

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const body = await readJsonObject(request);
    const result = await joinLeague(auth.user.id, {
      reference:
        typeof body.leagueId === 'string'
          ? body.leagueId
          : typeof body.slug === 'string'
            ? body.slug
            : undefined,
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
