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
      title: 'Sincronizacao em andamento',
      detail: 'A API esta sendo consultada e os jogos serao atualizados em seguida.',
    };
  }

  if (schedule.lastStatus === 'running') {
    return {
      state: 'failed',
      tone: 'danger',
      title: 'Sincronizacao interrompida',
      detail: 'A ultima execucao iniciou, mas nao foi concluida em ate 15 minutos.',
    };
  }

  if (schedule.lastStatus === 'failed' || latest?.status === 'failed') {
    return {
      state: 'failed',
      tone: 'danger',
      title: 'Falha na ultima sincronizacao',
      detail: schedule.lastError || latest?.error || 'A operacao falhou sem detalhe adicional.',
    };
  }

  if (!latest) {
    return {
      state: 'never',
      tone: 'neutral',
      title: 'Sincronizacao ainda nao executada',
      detail: schedule.enabled
        ? 'O agendamento esta ativo e aguarda a primeira execucao.'
        : 'Ative o agendamento ou execute uma sincronizacao manual.',
    };
  }

  if (latest.status === 'degraded' || latest.source === 'backup') {
    return {
      state: 'degraded',
      tone: 'warning',
      title: 'API indisponivel, backup utilizado',
      detail: latest.error || 'Os dados locais mantiveram o sistema operacional.',
    };
  }

  const staleAfterMinutes = Math.max(schedule.intervalMinutes * 3, 30);
  const age = now.getTime() - latest.syncedAt.getTime();
  if (age > staleAfterMinutes * 60 * 1000) {
    return {
      state: 'stale',
      tone: 'warning',
      title: 'Sincronizacao atrasada',
      detail: `Nenhuma atualizacao bem-sucedida nos ultimos ${staleAfterMinutes} minutos.`,
    };
  }

  return {
    state: 'healthy',
    tone: 'ok',
    title: 'API sincronizada',
    detail: 'A fonte principal respondeu e os dados estao dentro do intervalo esperado.',
  };
}
