import { NextResponse } from 'next/server';
import { discoverPublicLeagues } from '@/lib/league-service';
import { leagueErrorResponse } from '../_shared';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(
      await discoverPublicLeagues({
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        limit: Number(searchParams.get('limit')) || undefined,
        offset: Number(searchParams.get('offset')) || undefined,
      }),
    );
  } catch (error) {
    return leagueErrorResponse(error, 'Erro ao descobrir boloes publicos.');
  }
}
