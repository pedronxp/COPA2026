import 'server-only';

import type { Prisma } from '@prisma/client';
import { recordAdminAudit } from '@/lib/admin-auth';
import {
  diffAdminLeagueRules,
  disableOptionalScoringRules,
  parseAdminLeagueRules,
  parseAdminRuleImpactMode,
  type AdminLeagueRuleInput,
  type AdminRuleImpactMode,
} from '@/lib/admin-pool-governance-domain';
import { prisma } from '@/lib/prisma';
import { calculatePredictionScore } from '@/lib/scoring-domain';
import { summarizeGlobalPerformance } from '@/lib/scoring-service';
import type { SessionUser } from '@/lib/session';

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

function ruleSnapshot(league: {
  scoringPreset: string;
  scoringStartMatchday: number;
  groupPublicationMode: string;
  knockoutPublicationMode: string;
  windowHours: number;
  maxEdits: number;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
  pointsBothScoreYes: number;
  pointsBothScoreNo: number;
}): AdminLeagueRuleInput {
  return {
    scoringPreset: league.scoringPreset as AdminLeagueRuleInput['scoringPreset'],
    scoringStartMatchday: league.scoringStartMatchday,
    groupPublicationMode:
      league.groupPublicationMode as AdminLeagueRuleInput['groupPublicationMode'],
    knockoutPublicationMode:
      league.knockoutPublicationMode as AdminLeagueRuleInput['knockoutPublicationMode'],
    windowHours: league.windowHours,
    maxEdits: league.maxEdits,
    pointsExact: league.pointsExact,
    pointsDiff: league.pointsDiff,
    pointsWinner: league.pointsWinner,
    pointsWinnerHome: league.pointsWinnerHome,
    pointsWinnerAway: league.pointsWinnerAway,
    pointsDraw: league.pointsDraw,
    pointsBothScoreYes: league.pointsBothScoreYes,
    pointsBothScoreNo: league.pointsBothScoreNo,
  };
}

function ruleUpdateData(rules: AdminLeagueRuleInput): Prisma.LeagueUpdateInput {
  return {
    scoringPreset: rules.scoringPreset,
    scoringStartMatchday: rules.scoringStartMatchday,
    groupPublicationMode: rules.groupPublicationMode,
    knockoutPublicationMode: rules.knockoutPublicationMode,
    windowHours: rules.windowHours,
    maxEdits: rules.maxEdits,
    pointsExact: rules.pointsExact,
    pointsDiff: rules.pointsDiff,
    pointsWinner: rules.pointsWinner,
    pointsWinnerHome: rules.pointsWinnerHome,
    pointsWinnerAway: rules.pointsWinnerAway,
    pointsDraw: rules.pointsDraw,
    pointsBothScoreYes: rules.pointsBothScoreYes,
    pointsBothScoreNo: rules.pointsBothScoreNo,
  };
}

export async function getAdminLeagueGovernance(reference: string) {
  const normalized = reference.trim();
  if (!normalized) throw new Error('Bolao nao informado.');

  const league = await prisma.league.findFirst({
    where: { OR: [{ id: normalized }, { slug: normalized }] },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        where: { status: 'active' },
        orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
        select: {
          userId: true,
          role: true,
          points: true,
          pendingPoints: true,
          exactScoreStreak: true,
          bestExactScoreStreak: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              points: true,
              streak: true,
              misses: true,
            },
          },
        },
      },
      _count: {
        select: {
          members: true,
          predictions: true,
          pointEntries: true,
          joinRequests: true,
        },
      },
    },
  });
  if (!league) throw new Error('Bolao nao encontrado.');

  const [pointStatus, recentAudit, globalUsers] = await Promise.all([
    prisma.leaguePointEntry.groupBy({
      by: ['status'],
      where: { leagueId: league.id },
      _count: { status: true },
      _sum: { points: true },
    }),
    prisma.adminAuditLog.findMany({
      where: { entityType: 'league', entityId: league.id },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    league.id === 'global'
      ? prisma.user.findMany({
          orderBy: [{ points: 'desc' }, { createdAt: 'desc' }],
          take: 50,
          select: {
            id: true,
            name: true,
            email: true,
            points: true,
            streak: true,
            misses: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    ...league,
    isGlobal: league.id === 'global',
    rules: ruleSnapshot(league),
    pointStatus,
    recentAudit,
    globalUsers,
  };
}

async function recomputeExactScoreStreakForUser(
  tx: Prisma.TransactionClient,
  leagueId: string,
  userId: string,
) {
  const predictions = await tx.prediction.findMany({
    where: {
      leagueId,
      userId,
      processed: true,
      match: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
    },
    orderBy: { match: { kickOff: 'asc' } },
    select: {
      homeGuess: true,
      awayGuess: true,
      match: { select: { homeScore: true, awayScore: true } },
    },
  });

  let current = 0;
  let best = 0;
  for (const prediction of predictions) {
    const exact =
      prediction.homeGuess === prediction.match.homeScore &&
      prediction.awayGuess === prediction.match.awayScore;
    current = exact ? current + 1 : 0;
    best = Math.max(best, current);
  }

  await tx.leagueMember.updateMany({
    where: { leagueId, userId },
    data: { exactScoreStreak: current, bestExactScoreStreak: best },
  });
}

async function refreshCustomLeagueMemberTotals(
  tx: Prisma.TransactionClient,
  leagueId: string,
  userIds: string[],
) {
  for (const userId of [...new Set(userIds)]) {
    const [published, pending] = await Promise.all([
      tx.leaguePointEntry.aggregate({
        where: { leagueId, userId, status: 'published' },
        _sum: { points: true },
      }),
      tx.leaguePointEntry.aggregate({
        where: { leagueId, userId, status: 'pending' },
        _sum: { points: true },
      }),
    ]);

    await tx.leagueMember.updateMany({
      where: { leagueId, userId },
      data: {
        points: published._sum.points ?? 0,
        pendingPoints: pending._sum.points ?? 0,
      },
    });
    await recomputeExactScoreStreakForUser(tx, leagueId, userId);
  }
}

async function refreshGlobalUserTotals(
  tx: Prisma.TransactionClient,
  userIds: string[],
) {
  for (const userId of [...new Set(userIds)]) {
    const rows = await tx.prediction.findMany({
      where: {
        leagueId: 'global',
        userId,
        processed: true,
        match: {
          status: 'finished',
          homeScore: { not: null },
          awayScore: { not: null },
        },
        pointEntry: { isNot: null },
      },
      orderBy: { match: { kickOff: 'asc' } },
      select: { pointEntry: { select: { points: true } } },
    });

    await tx.user.update({
      where: { id: userId },
      data: summarizeGlobalPerformance(
        rows.map((row) => ({ points: row.pointEntry?.points ?? 0 })),
      ),
    });
  }
}

export async function recomputeAdminLeagueScoring(input: {
  actor: SessionUser;
  leagueId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const league = await prisma.league.findUnique({ where: { id: input.leagueId } });
  if (!league) throw new Error('Bolao nao encontrado.');

  return prisma.$transaction(async (tx) => {
    const predictions = await tx.prediction.findMany({
      where: {
        leagueId: league.id,
        processed: true,
        match: {
          status: 'finished',
          homeScore: { not: null },
          awayScore: { not: null },
        },
      },
      include: { match: true, pointEntry: true },
      orderBy: { match: { kickOff: 'asc' } },
    });
    const affectedUsers: string[] = [];
    let updatedEntries = 0;

    for (const prediction of predictions) {
      if (!prediction.pointEntry) continue;
      const score = calculatePredictionScore(
        prediction.homeGuess,
        prediction.awayGuess,
        prediction.match.homeScore ?? 0,
        prediction.match.awayScore ?? 0,
        league,
      );

      if (prediction.pointEntry.points !== score.total) updatedEntries += 1;
      affectedUsers.push(prediction.userId);
      await tx.leaguePointEntry.update({
        where: { id: prediction.pointEntry.id },
        data: {
          points: score.total,
          metadata: {
            score: score as unknown as Prisma.InputJsonValue,
            prediction: { home: prediction.homeGuess, away: prediction.awayGuess },
            result: {
              home: prediction.match.homeScore,
              away: prediction.match.awayScore,
            },
            recomputedByAdmin: input.actor.id,
          },
        },
      });
    }

    if (league.id === 'global') {
      await refreshGlobalUserTotals(tx, affectedUsers);
    } else {
      await refreshCustomLeagueMemberTotals(tx, league.id, affectedUsers);
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: input.actor.id,
        action: 'league.scoring_recompute',
        entityType: 'league',
        entityId: league.id,
        summary: `${input.actor.email} recalculou a pontuacao do bolao ${league.name}.`,
        metadata: safeJson({
          reason,
          predictions: predictions.length,
          updatedEntries,
          affectedUsers: [...new Set(affectedUsers)],
        }),
      },
    });

    return { predictions: predictions.length, updatedEntries };
  });
}

export async function updateAdminLeagueRules(input: {
  actor: SessionUser;
  leagueId: string;
  values: Record<string, unknown>;
  impactMode: AdminRuleImpactMode;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const impactMode = parseAdminRuleImpactMode(input.impactMode);
  const league = await prisma.league.findUnique({ where: { id: input.leagueId } });
  if (!league) throw new Error('Bolao nao encontrado.');

  const before = ruleSnapshot(league);
  const after = parseAdminLeagueRules(input.values, before);
  const changedFields = diffAdminLeagueRules(before, after);
  if (changedFields.length === 0) throw new Error('Nenhuma regra foi alterada.');

  await prisma.league.update({ where: { id: league.id }, data: ruleUpdateData(after) });
  await recordAdminAudit({
    actorId: input.actor.id,
    action: 'league.rules_update',
    entityType: 'league',
    entityId: league.id,
    summary: `${input.actor.email} atualizou regras do bolao ${league.name}.`,
    metadata: safeJson({
      reason,
      impactMode,
      changedFields,
      before,
      after,
      isGlobal: league.id === 'global',
    }),
  });

  if (impactMode === 'recompute_scored') {
    await recomputeAdminLeagueScoring({
      actor: input.actor,
      leagueId: league.id,
      reason: `${reason} (recalculo apos edicao de regras)`,
    });
  }
}

export async function deleteAdminOptionalScoringRules(input: {
  actor: SessionUser;
  leagueId: string;
  impactMode: AdminRuleImpactMode;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const impactMode = parseAdminRuleImpactMode(input.impactMode);
  const league = await prisma.league.findUnique({ where: { id: input.leagueId } });
  if (!league) throw new Error('Bolao nao encontrado.');

  const before = ruleSnapshot(league);
  const after = disableOptionalScoringRules(before);
  const changedFields = diffAdminLeagueRules(before, after);
  if (changedFields.length === 0) {
    throw new Error('As regras opcionais ja estao desativadas.');
  }

  await prisma.league.update({ where: { id: league.id }, data: ruleUpdateData(after) });
  await recordAdminAudit({
    actorId: input.actor.id,
    action: 'league.optional_rules_delete',
    entityType: 'league',
    entityId: league.id,
    summary: `${input.actor.email} desativou bonus opcionais do bolao ${league.name}.`,
    metadata: safeJson({ reason, impactMode, changedFields, before, after }),
  });

  if (impactMode === 'recompute_scored') {
    await recomputeAdminLeagueScoring({
      actor: input.actor,
      leagueId: league.id,
      reason: `${reason} (recalculo apos remocao de bonus opcionais)`,
    });
  }
}

export async function resetAdminUserPoolScore(input: {
  actor: SessionUser;
  leagueId: string;
  targetUserId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const user = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: { id: true, email: true, points: true, streak: true, misses: true },
  });
  if (!user) throw new Error('Usuario nao encontrado.');

  if (input.leagueId === 'global') {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { points: 0, streak: 0, misses: 0 },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorId: input.actor.id,
          action: 'league.score_reset',
          entityType: 'league',
          entityId: 'global',
          summary: `${input.actor.email} zerou a pontuacao global de ${user.email}.`,
          metadata: safeJson({
            reason,
            targetUserId: user.id,
            before: { points: user.points, streak: user.streak, misses: user.misses },
            after: { points: 0, streak: 0, misses: 0 },
          }),
        },
      }),
    ]);
    return;
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: input.leagueId, userId: user.id } },
    include: { league: { select: { name: true } } },
  });
  if (!membership || membership.status !== 'active') {
    throw new Error('Usuario nao e membro ativo deste bolao.');
  }

  await prisma.$transaction([
    prisma.leagueMember.update({
      where: { id: membership.id },
      data: {
        points: 0,
        pendingPoints: 0,
        exactScoreStreak: 0,
        bestExactScoreStreak: 0,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: input.actor.id,
        action: 'league.score_reset',
        entityType: 'league',
        entityId: input.leagueId,
        summary: `${input.actor.email} zerou a pontuacao de ${user.email} no bolao ${membership.league.name}.`,
        metadata: safeJson({
          reason,
          targetUserId: user.id,
          before: {
            points: membership.points,
            pendingPoints: membership.pendingPoints,
            exactScoreStreak: membership.exactScoreStreak,
            bestExactScoreStreak: membership.bestExactScoreStreak,
          },
          after: {
            points: 0,
            pendingPoints: 0,
            exactScoreStreak: 0,
            bestExactScoreStreak: 0,
          },
        }),
      },
    }),
  ]);
}

export async function removeAdminLeagueMember(input: {
  actor: SessionUser;
  leagueId: string;
  targetUserId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  if (input.leagueId === 'global') {
    throw new Error('O bolao principal nao usa remocao de membros.');
  }

  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: { leagueId: input.leagueId, userId: input.targetUserId },
    },
    include: {
      league: { select: { name: true, ownerId: true } },
      user: { select: { email: true } },
    },
  });
  if (!membership || membership.status !== 'active') {
    throw new Error('Membro ativo nao encontrado.');
  }
  if (membership.role === 'owner' || membership.league.ownerId === input.targetUserId) {
    throw new Error('O dono do bolao nao pode ser removido.');
  }

  await prisma.$transaction([
    prisma.leagueMember.delete({ where: { id: membership.id } }),
    prisma.leagueJoinRequest.deleteMany({
      where: { leagueId: input.leagueId, userId: input.targetUserId },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: input.actor.id,
        action: 'league.member_remove',
        entityType: 'league',
        entityId: input.leagueId,
        summary: `${input.actor.email} removeu ${membership.user.email} do bolao ${membership.league.name}.`,
        metadata: safeJson({
          reason,
          targetUserId: input.targetUserId,
          before: {
            role: membership.role,
            points: membership.points,
            pendingPoints: membership.pendingPoints,
            exactScoreStreak: membership.exactScoreStreak,
            bestExactScoreStreak: membership.bestExactScoreStreak,
          },
        }),
      },
    }),
  ]);

  return { removed: true };
}
