import { NextRequest, NextResponse } from 'next/server';
import { runDueScheduledSync } from '@/lib/sync-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const syncSecret = process.env.SYNC_SECRET;
  const authHeader = request.headers.get('authorization');

  // 1. Autoriza se corresponder ao CRON_SECRET da Vercel
  if (secret && (authHeader === `Bearer ${secret}` || request.headers.get('x-cron-secret') === secret)) {
    return true;
  }

  // 2. Autoriza se corresponder ao SYNC_SECRET do projeto
  if (syncSecret && (authHeader === `Bearer ${syncSecret}` || request.headers.get('x-sync-secret') === syncSecret)) {
    return true;
  }

  return false;
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Cron não autorizado.' }, { status: 401 });
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
