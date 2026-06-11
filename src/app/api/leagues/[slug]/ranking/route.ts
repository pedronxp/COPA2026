import { NextResponse } from 'next/server';
import { getLeagueRanking } from '@/lib/league-service';
import { getCurrentUser } from '@/lib/session';
import { leagueErrorResponse } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const [{ slug }, user] = await Promise.all([params, getCurrentUser()]);
    return NextResponse.json(await getLeagueRanking(slug, user?.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar ranking.');
  }
}
