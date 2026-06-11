import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-session';
import {
  changeMemberRole,
  createLeague,
  discoverPublicLeagues,
  listMyLeagues,
  parseMemberRole,
  removeLeagueMember,
  transferLeagueOwnership,
  updateLeague,
  validateLeagueUpdateInput,
} from '@/lib/league-service';
import { leagueErrorResponse, readJsonObject } from './_shared';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('scope') === 'public') {
      return NextResponse.json(
        await discoverPublicLeagues({
          search: searchParams.get('search') || undefined,
          status: searchParams.get('status') || undefined,
          limit: Number(searchParams.get('limit')) || undefined,
          offset: Number(searchParams.get('offset')) || undefined,
        }),
      );
    }

    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    return NextResponse.json(await listMyLeagues(auth.user.id));
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao buscar bolões.');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const body = await readJsonObject(request);
    return NextResponse.json(await createLeague(auth.user.id, body), {
      status: 201,
    });
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao criar bolão.');
  }
}

// Compatibility endpoint for the current league settings and member controls.
export async function PUT(request: Request) {
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
      typeof body.targetMemberId === 'string' ? body.targetMemberId : '';
    const action = typeof body.action === 'string' ? body.action : '';

    if (action && targetUserId) {
      if (action === 'promote' || action === 'demote') {
        const role = parseMemberRole(
          action === 'promote' ? 'subadmin' : 'member',
        );
        const member = await changeMemberRole(
          reference,
          auth.user.id,
          targetUserId,
          role,
        );
        return NextResponse.json({
          success: true,
          member,
          message:
            role === 'subadmin'
              ? 'Membro promovido a subadministrador.'
              : 'Cargo alterado para membro comum.',
        });
      }
      if (action === 'remove') {
        await removeLeagueMember(reference, auth.user.id, targetUserId);
        return NextResponse.json({
          success: true,
          message: 'Membro removido do bolão.',
        });
      }
      if (action === 'transfer') {
        return NextResponse.json(
          await transferLeagueOwnership(reference, auth.user.id, targetUserId),
        );
      }
    }

    const { leagueId: _leagueId, slug: _slug, ...updates } = body;
    void _leagueId;
    void _slug;
    validateLeagueUpdateInput(updates);
    return NextResponse.json(
      await updateLeague(reference, auth.user.id, updates),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao atualizar bolão.');
  }
}
