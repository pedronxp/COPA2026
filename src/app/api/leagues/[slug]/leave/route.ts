import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import { leaveLeague } from '@/lib/league-service';
import { leagueErrorResponse } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { slug } = await params;
    return NextResponse.json(await leaveLeague(slug, auth.user.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao sair do bolão.');
  }
}

export const DELETE = POST;
