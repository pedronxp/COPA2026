import 'server-only';

import { prisma } from '@/lib/prisma';
import { syncFromApi, type SyncReport } from '@/lib/matches-service';

export const SYNC_INTERVALS = [5, 10, 15, 30, 60, 180, 360, 720, 1440] as const;

function nextRun(intervalMinutes: number) {
  return new Date(Date.now() + intervalMinutes * 60 * 1000);
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Erro desconhecido na sincronizacao.';
}

export async function getSyncSchedule() {
  return prisma.syncSchedule.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      intervalMinutes: 5,
      nextRunAt: new Date(),
    },
  });
}

export async function updateSyncSchedule(input: {
  enabled: boolean;
  intervalMinutes: number;
}) {
  if (!SYNC_INTERVALS.includes(input.intervalMinutes as (typeof SYNC_INTERVALS)[number])) {
    throw new Error('Intervalo de sincronizacao invalido.');
  }

  return prisma.syncSchedule.upsert({
    where: { id: 'default' },
    update: {
      enabled: input.enabled,
      intervalMinutes: input.intervalMinutes,
      nextRunAt: input.enabled ? new Date() : null,
    },
    create: {
      id: 'default',
      enabled: input.enabled,
      intervalMinutes: input.intervalMinutes,
      nextRunAt: input.enabled ? new Date() : null,
    },
  });
}

async function completeSync(
  schedule: Awaited<ReturnType<typeof getSyncSchedule>>,
  trigger: 'manual' | 'scheduled',
): Promise<SyncReport> {
  try {
    const report = await syncFromApi(trigger);
    await prisma.syncSchedule.update({
      where: { id: schedule.id },
      data: {
        lastStatus: report.status,
        lastError: report.error,
        lastSuccessAt: report.status === 'success' ? new Date() : schedule.lastSuccessAt,
      },
    });

    // Revalidar caminhos do Next.js para refletir novos status e placares no site
    if (report.created > 0 || report.updated > 0) {
      try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath('/dashboard');
        revalidatePath('/matches');
        revalidatePath('/');
        revalidatePath('/results');
        revalidatePath('/calendar');
        revalidatePath('/leaderboard');
        revalidatePath('/admin/matches');
      } catch (err) {
        console.error('Falha ao revalidar caminhos na sincronização:', err);
      }
    }

    return report;
  } catch (error) {
    const detail = message(error);
    await prisma.$transaction([
      prisma.syncLog.create({
        data: {
          source: 'worldcup26',
          status: 'failed',
          trigger,
          error: detail,
        },
      }),
      prisma.syncSchedule.update({
        where: { id: schedule.id },
        data: {
          lastStatus: 'failed',
          lastError: detail,
        },
      }),
    ]);
    throw error;
  }
}

export async function executeSync(trigger: 'manual' | 'scheduled'): Promise<SyncReport> {
  const schedule = await getSyncSchedule();
  const runningSchedule = await prisma.syncSchedule.update({
    where: { id: schedule.id },
    data: {
      lastAttemptAt: new Date(),
      lastStatus: 'running',
      lastError: null,
      nextRunAt: schedule.enabled ? nextRun(schedule.intervalMinutes) : null,
    },
  });
  return completeSync(runningSchedule, trigger);
}

export async function runDueScheduledSync() {
  const schedule = await getSyncSchedule();
  const now = new Date();

  if (!schedule.enabled || (schedule.nextRunAt && schedule.nextRunAt > now)) {
    return {
      executed: false,
      nextRunAt: schedule.nextRunAt,
      reason: schedule.enabled ? 'not_due' : 'disabled',
    };
  }

  const claimed = await prisma.syncSchedule.updateMany({
    where: {
      id: schedule.id,
      enabled: true,
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
    },
    data: {
      nextRunAt: nextRun(schedule.intervalMinutes),
      lastAttemptAt: now,
      lastStatus: 'running',
      lastError: null,
    },
  });

  if (claimed.count === 0) {
    return { executed: false, nextRunAt: schedule.nextRunAt, reason: 'already_claimed' };
  }

  const runningSchedule = await prisma.syncSchedule.findUniqueOrThrow({
    where: { id: schedule.id },
  });
  const report = await completeSync(runningSchedule, 'scheduled');
  return { executed: true, report };
}
