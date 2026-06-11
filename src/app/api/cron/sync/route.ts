import { NextRequest, NextResponse } from 'next/server';
import { runDueScheduledSync } from '@/lib/sync-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = request.headers.get('authorization');
  return bearer === `Bearer ${secret}` || request.headers.get('x-cron-secret') === secret;
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Cron nao autorizado.' }, { status: 401 });
  }

  try {
    return NextResponse.json(await runDueScheduledSync());
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Falha desconhecida.';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
