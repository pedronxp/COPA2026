import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAdminAudit, type AdminPermission } from '@/lib/admin-auth';
import type { SessionUser } from '@/lib/session';
import { syncFromApi, updateMatchScore } from '@/lib/matches-service';

const LEAGUE_STATUSES = new Set(['draft', 'active', 'closed', 'archived']);
const ACCOUNT_STATUSES = new Set(['active', 'blocked', 'suspended', 'banned']);
const MATCH_STATUSES = new Set(['scheduled', 'live', 'finished']);

export function permissionForAdminSection(section: string | null): AdminPermission {
  if (section === 'resets') return 'resets:manage';
  if (section === 'users') return 'users:moderate';
  if (section === 'leagues') return 'leagues:manage';
  if (section === 'matches') return 'matches:operate';
  if (section === 'audit') return 'audit:view';
  return 'dashboard:view';
}

function normalizeQuery(query?: string | null) {
  return (query || '').trim();
}

function requireReason(reason: string | null | undefined) {
  const value = (reason || '').trim();
  if (value.length < 3) {
    throw new Error('Informe um motivo com pelo menos 3 caracteres.');
  }
  return value;
}

function safeJson(input: unknown): Prisma.InputJsonObject {
  return input as Prisma.InputJsonObject;
}

export async function getAdminDashboardData() {
  const [
    totalUsers,
    activeUsers,
    restrictedUsers,
    totalLeagues,
    activeLeagues,
    totalMatches,
    finishedMatches,
    liveMatches,
    predictions,
    pendingResets,
    latestSync,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: 'active' } }),
    prisma.user.count({ where: { accountStatus: { not: 'active' } } }),
    prisma.league.count(),
    prisma.league.count({ where: { status: 'active' } }),
    prisma.match.count(),
    prisma.match.count({ where: { status: 'finished' } }),
    prisma.match.count({ where: { status: 'live' } }),
    prisma.prediction.count(),
    prisma.passwordResetRequest.count({ where: { status: 'pending' } }),
    prisma.syncLog.findFirst({ orderBy: { syncedAt: 'desc' } }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const staleSync =
    !latestSync || Date.now() - latestSync.syncedAt.getTime() > 6 * 60 * 60 * 1000;

  return {
    users: { total: totalUsers, active: activeUsers, restricted: restrictedUsers },
    leagues: { total: totalLeagues, active: activeLeagues },
    matches: { total: totalMatches, finished: finishedMatches, live: liveMatches },
    predictions,
    pendingResets,
    latestSync,
    staleSync,
    recentAudit,
  };
}

export async function listPasswordResetRequests(status?: string | null) {
  const value = normalizeQuery(status);
  const where = value && value !== 'all' ? { status: value } : {};

  return prisma.passwordResetRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function decidePasswordResetRequest(input: {
  actor: SessionUser;
  requestId: string;
  action: 'approve' | 'reject';
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const resetReq = await prisma.passwordResetRequest.findUnique({
    where: { id: input.requestId },
    include: { user: { select: { email: true } } },
  });

  if (!resetReq) throw new Error('Solicitacao nao encontrada.');
  if (resetReq.status !== 'pending') throw new Error('Esta solicitacao ja foi processada.');

  if (input.action === 'approve') {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetReq.userId },
        data: { passwordHash: resetReq.proposedPasswordHash },
      }),
      prisma.passwordResetRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'approved',
          reviewedById: input.actor.id,
          reviewedAt: new Date(),
          reviewNote: reason,
        },
      }),
    ]);
  } else {
    await prisma.passwordResetRequest.update({
      where: { id: input.requestId },
      data: {
        status: 'rejected',
        reviewedById: input.actor.id,
        reviewedAt: new Date(),
        reviewNote: reason,
      },
    });
  }

  await recordAdminAudit({
    actorId: input.actor.id,
    action: input.action === 'approve' ? 'password_reset.approve' : 'password_reset.reject',
    entityType: 'password_reset_request',
    entityId: input.requestId,
    summary: `${input.actor.email} ${input.action === 'approve' ? 'aprovou' : 'rejeitou'} redefinicao de senha para ${resetReq.user.email}.`,
    metadata: safeJson({ reason, targetUserId: resetReq.userId }),
  });
}

export async function searchAdminUsers(query?: string | null) {
  const q = normalizeQuery(query);

  return prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: [{ accountStatus: 'asc' }, { points: 'desc' }, { createdAt: 'desc' }],
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      adminRole: true,
      accountStatus: true,
      suspendedUntil: true,
      moderationReason: true,
      createdAt: true,
      _count: {
        select: {
          sessions: true,
          leaguesJoined: true,
          predictions: true,
        },
      },
    },
  });
}

export async function moderateUser(input: {
  actor: SessionUser;
  targetUserId: string;
  accountStatus: string;
  reason: string;
  suspendedUntil?: Date | null;
}) {
  const reason = requireReason(input.reason);
  if (!ACCOUNT_STATUSES.has(input.accountStatus)) throw new Error('Status de conta invalido.');
  if (input.actor.id === input.targetUserId && input.accountStatus !== 'active') {
    throw new Error('Voce nao pode restringir a propria conta.');
  }

  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, adminRole: true, accountStatus: true },
  });
  if (!target) throw new Error('Usuario nao encontrado.');
  if (target.adminRole === 'super_admin' && input.actor.id !== target.id) {
    throw new Error('Super admins nao podem ser restringidos por outro admin.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.targetUserId },
      data: {
        accountStatus: input.accountStatus,
        suspendedUntil: input.accountStatus === 'suspended' ? input.suspendedUntil : null,
        moderationReason: input.accountStatus === 'active' ? null : reason,
      },
    }),
    prisma.session.updateMany({
      where: {
        userId: input.targetUserId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  await recordAdminAudit({
    actorId: input.actor.id,
    action: `user.${input.accountStatus}`,
    entityType: 'user',
    entityId: input.targetUserId,
    summary: `${input.actor.email} alterou ${target.email} de ${target.accountStatus} para ${input.accountStatus}.`,
    metadata: safeJson({ reason, suspendedUntil: input.suspendedUntil?.toISOString() ?? null }),
  });
}

export async function listAdminLeagues(query?: string | null) {
  const q = normalizeQuery(query);

  return prisma.league.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { inviteCode: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: { members: true, joinRequests: true, predictions: true },
      },
    },
  });
}

export async function updateAdminLeague(input: {
  actor: SessionUser;
  leagueId: string;
  name?: string | null;
  status?: string | null;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const league = await prisma.league.findUnique({ where: { id: input.leagueId } });
  if (!league) throw new Error('Bolao nao encontrado.');

  const data: Prisma.LeagueUpdateInput = {};
  const nextName = normalizeQuery(input.name);
  const nextStatus = normalizeQuery(input.status);

  if (nextName && nextName !== league.name) data.name = nextName;
  if (nextStatus && nextStatus !== league.status) {
    if (!LEAGUE_STATUSES.has(nextStatus)) throw new Error('Status de bolao invalido.');
    data.status = nextStatus;
  }

  if (Object.keys(data).length === 0) throw new Error('Nenhuma alteracao informada.');

  const updated = await prisma.league.update({
    where: { id: input.leagueId },
    data,
  });

  await recordAdminAudit({
    actorId: input.actor.id,
    action: 'league.update',
    entityType: 'league',
    entityId: input.leagueId,
    summary: `${input.actor.email} atualizou o bolao ${league.name}.`,
    metadata: safeJson({
      reason,
      before: { name: league.name, status: league.status },
      after: { name: updated.name, status: updated.status },
    }),
  });
}

export async function getMatchOperationsData() {
  const [syncLogs, matches, statusCounts] = await Promise.all([
    prisma.syncLog.findMany({ orderBy: { syncedAt: 'desc' }, take: 12 }),
    prisma.match.findMany({
      orderBy: { kickOff: 'asc' },
      take: 80,
      include: { _count: { select: { predictions: true } } },
    }),
    prisma.match.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  return { syncLogs, matches, statusCounts };
}

export async function triggerAdminSync(actor: SessionUser) {
  const report = await syncFromApi();

  await recordAdminAudit({
    actorId: actor.id,
    action: 'sync.trigger',
    entityType: 'sync',
    summary: `${actor.email} disparou sincronizacao manual.`,
    metadata: safeJson(report),
  });

  return report;
}

export async function correctAdminMatch(input: {
  actor: SessionUser;
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  if (!Number.isInteger(input.homeScore) || !Number.isInteger(input.awayScore)) {
    throw new Error('Placar deve usar numeros inteiros.');
  }
  if (input.homeScore < 0 || input.awayScore < 0 || input.homeScore > 99 || input.awayScore > 99) {
    throw new Error('Placar deve ficar entre 0 e 99.');
  }
  if (!MATCH_STATUSES.has(input.status)) throw new Error('Status de partida invalido.');

  const before = await prisma.match.findUnique({ where: { id: input.matchId } });
  if (!before) throw new Error('Partida nao encontrada.');

  const updated = await updateMatchScore(
    input.matchId,
    input.homeScore,
    input.awayScore,
    input.status as 'scheduled' | 'live' | 'finished',
  );

  await recordAdminAudit({
    actorId: input.actor.id,
    action: 'match.correct',
    entityType: 'match',
    entityId: input.matchId,
    summary: `${input.actor.email} corrigiu ${before.homeTeam} x ${before.awayTeam}.`,
    metadata: safeJson({
      reason,
      before: {
        homeScore: before.homeScore,
        awayScore: before.awayScore,
        status: before.status,
      },
      after: {
        homeScore: updated.homeScore,
        awayScore: updated.awayScore,
        status: updated.status,
      },
    }),
  });
}

export async function listAdminAuditLogs(input?: {
  action?: string | null;
  entityType?: string | null;
}) {
  const action = normalizeQuery(input?.action);
  const entityType = normalizeQuery(input?.entityType);

  return prisma.adminAuditLog.findMany({
    where: {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(entityType ? { entityType } : {}),
    },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
