export type SyncHealthTone = 'ok' | 'warning' | 'danger' | 'neutral';

export interface SyncHealth {
  state: 'healthy' | 'syncing' | 'degraded' | 'stale' | 'failed' | 'never';
  tone: SyncHealthTone;
  title: string;
  detail: string;
}

interface SyncLogLike {
  syncedAt: Date;
  status: string;
  source: string;
  error?: string | null;
}

interface SyncScheduleLike {
  enabled: boolean;
  intervalMinutes: number;
  lastStatus: string;
  lastError?: string | null;
  lastAttemptAt?: Date | null;
}

export function deriveSyncHealth(
  latest: SyncLogLike | null,
  schedule: SyncScheduleLike,
  now = new Date(),
): SyncHealth {
  const runningAge = schedule.lastAttemptAt
    ? now.getTime() - schedule.lastAttemptAt.getTime()
    : Number.POSITIVE_INFINITY;
  if (schedule.lastStatus === 'running' && runningAge <= 15 * 60 * 1000) {
    return {
      state: 'syncing',
      tone: 'warning',
      title: 'Sincronização em andamento',
      detail: 'A API está sendo consultada e os jogos serão atualizados em seguida.',
    };
  }

  if (schedule.lastStatus === 'running') {
    return {
      state: 'failed',
      tone: 'danger',
      title: 'Sincronização interrompida',
      detail: 'A última execução iniciou, mas não foi concluída em até 15 minutos.',
    };
  }

  if (schedule.lastStatus === 'failed' || latest?.status === 'failed') {
    return {
      state: 'failed',
      tone: 'danger',
      title: 'Falha na última sincronização',
      detail: schedule.lastError || latest?.error || 'A operação falhou sem detalhe adicional.',
    };
  }

  if (!latest) {
    return {
      state: 'never',
      tone: 'neutral',
      title: 'Sincronização ainda não executada',
      detail: schedule.enabled
        ? 'O agendamento está ativo e aguarda a primeira execução.'
        : 'Ative o agendamento ou execute uma sincronização manual.',
    };
  }

  if (latest.status === 'degraded' || latest.source === 'backup' || latest.source === 'database') {
    return {
      state: 'degraded',
      tone: 'warning',
      title: latest.source === 'database'
        ? 'API indisponível, banco preservado'
        : 'API indisponível, backup utilizado',
      detail: latest.error || 'Os dados locais mantiveram o sistema operacional.',
    };
  }

  const staleAfterMinutes = Math.max(schedule.intervalMinutes * 3, 30);
  const age = now.getTime() - latest.syncedAt.getTime();
  if (age > staleAfterMinutes * 60 * 1000) {
    return {
      state: 'stale',
      tone: 'warning',
      title: 'Sincronização atrasada',
      detail: `Nenhuma atualização bem-sucedida nos últimos ${staleAfterMinutes} minutos.`,
    };
  }

  return {
    state: 'healthy',
    tone: 'ok',
    title: 'API sincronizada',
    detail: 'A fonte principal respondeu e os dados estão dentro do intervalo esperado.',
  };
}
