import { NextResponse } from 'next/server';
import { getFeaturedMatches } from '@/lib/landing-matches';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      matches: await getFeaturedMatches(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar partidas.' },
      { status: 500 },
    );
  }
}
