// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { syncFromApi } from '@/lib/matches-service';
import { prisma } from '@/lib/prisma';

// POST: Dispara sincronização com a API WorldCup26.ir
export async function POST(request: Request) {
  try {
    // Sincronização pública para permitir sync automático a partir do frontend sem expor segredos.

    const report = await syncFromApi();
    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Retorna o último log de sincronização
export async function GET() {
  try {
    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { syncedAt: 'desc' },
    });

    if (!lastSync) {
      return NextResponse.json(
        { message: 'Nenhuma sincronização realizada ainda.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: lastSync.id,
      syncedAt: lastSync.syncedAt.toISOString(),
      matchesCreated: lastSync.matchesCreated,
      matchesUpdated: lastSync.matchesUpdated,
      source: lastSync.source,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
