import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import {
  LeagueServiceError,
  decideJoinRequest,
  listJoinRequests,
} from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from '../../_shared';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { slug } = await params;
    return NextResponse.json(await listJoinRequests(slug, auth.user.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar solicitacoes.');
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const [{ slug }, body] = await Promise.all([params, readJsonObject(request)]);
    const requestId =
      typeof body.requestId === 'string' ? body.requestId : '';
    const decision =
      body.decision === 'approve' || body.action === 'approve'
        ? 'approve'
        : body.decision === 'reject' || body.action === 'reject'
          ? 'reject'
          : null;
    if (!requestId || !decision) {
      throw new LeagueServiceError(
        'requestId e decision sao obrigatorios.',
        400,
        'INVALID_DECISION',
      );
    }
    return NextResponse.json(
      await decideJoinRequest(slug, auth.user.id, requestId, decision),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao processar solicitacao.');
  }
}

export const PATCH = POST;
