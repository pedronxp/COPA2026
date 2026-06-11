import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import {
  getLeagueDetail,
  updateLeague,
  validateLeagueUpdateInput,
} from '@/lib/league-service';
import { getCurrentUser } from '@/lib/session';
import { leagueErrorResponse, readJsonObject } from '../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const [{ slug }, user] = await Promise.all([params, getCurrentUser()]);
    return NextResponse.json(await getLeagueDetail(slug, user?.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar bolão.');
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const [{ slug }, body] = await Promise.all([params, readJsonObject(request)]);
    validateLeagueUpdateInput(body);
    return NextResponse.json(await updateLeague(slug, auth.user.id, body));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao atualizar bolão.');
  }
}

export const PUT = PATCH;
