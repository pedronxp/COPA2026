import { NextRequest, NextResponse } from 'next/server';
import { runDemandSyncIfNeeded } from '@/lib/sync-service';
import { getCurrentUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Proteger endpoint exigindo usuário logado
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const result = await runDemandSyncIfNeeded();
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Falha ao rodar sincronização sob demanda.';
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
