import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, recordAdminAudit } = vi.hoisted(() => ({
  recordAdminAudit: vi.fn(),
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    league: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leagueMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    leagueJoinRequest: {
      deleteMany: vi.fn(),
    },
    leaguePointEntry: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    prediction: {
      findMany: vi.fn(),
    },
    adminAuditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/lib/admin-auth', () => ({ recordAdminAudit }));

import {
  recomputeAdminLeagueScoring,
  removeAdminLeagueMember,
  resetAdminUserPoolScore,
  updateAdminLeagueRules,
} from './admin-pool-governance-service';

const actor = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  image: null,
  points: 0,
  streak: 0,
  misses: 0,
  adminRole: 'super_admin',
  accountStatus: 'active',
  suspendedUntil: null,
};

const league = {
  id: 'global',
  name: 'Principal',
  scoringPreset: 'standard',
  scoringStartMatchday: 1,
  groupPublicationMode: 'match',
  knockoutPublicationMode: 'match',
  windowHours: 48,
  maxEdits: 3,
  pointsExact: 5,
  pointsDiff: 3,
  pointsWinner: 2,
  pointsWinnerHome: 2,
  pointsWinnerAway: 2,
  pointsDraw: 2,
  pointsBothScoreYes: 1,
  pointsBothScoreNo: 1,
};

describe('admin pool governance service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) return Promise.all(input);
      return input(prisma);
    });
  });

  it('updates league rules with audit metadata without recomputing future-only edits', async () => {
    prisma.league.findUnique.mockResolvedValue(league);
    prisma.league.update.mockResolvedValue({ ...league, pointsExact: 7 });

    await updateAdminLeagueRules({
      actor,
      leagueId: 'global',
      values: { pointsExact: 7 },
      impactMode: 'future_only',
      reason: 'Ajuste de regra',
    });

    expect(prisma.league.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'global' },
        data: expect.objectContaining({ pointsExact: 7 }),
      }),
    );
    expect(prisma.league.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          ownerEditUsedAt: expect.anything(),
          ownerEditUsedById: expect.anything(),
        }),
      }),
    );
    expect(recordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'league.rules_update',
        entityId: 'global',
        metadata: expect.objectContaining({ impactMode: 'future_only' }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('resets principal bolao user score fields', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'u@example.com',
      points: 10,
      streak: 2,
      misses: 1,
    });
    prisma.user.update.mockResolvedValue({});
    prisma.adminAuditLog.create.mockResolvedValue({});

    await resetAdminUserPoolScore({
      actor,
      leagueId: 'global',
      targetUserId: 'user-1',
      reason: 'Correcao manual',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { points: 0, streak: 0, misses: 0 },
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'league.score_reset' }),
      }),
    );
  });

  it('rejects custom score reset for missing membership', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'u@example.com',
      points: 0,
      streak: 0,
      misses: 0,
    });
    prisma.leagueMember.findUnique.mockResolvedValue(null);

    await expect(
      resetAdminUserPoolScore({
        actor,
        leagueId: 'league-1',
        targetUserId: 'user-1',
        reason: 'Correcao manual',
      }),
    ).rejects.toThrow(/membro ativo/);
  });

  it('rejects member removal from principal bolao', async () => {
    await expect(
      removeAdminLeagueMember({
        actor,
        leagueId: 'global',
        targetUserId: 'user-1',
        reason: 'Correcao manual',
      }),
    ).rejects.toThrow(/principal/);
    expect(prisma.leagueMember.delete).not.toHaveBeenCalled();
  });

  it('recomputes global scoring and refreshes user totals', async () => {
    prisma.league.findUnique.mockResolvedValue(league);
    prisma.prediction.findMany
      .mockResolvedValueOnce([
        {
          id: 'pred-1',
          userId: 'user-1',
          homeGuess: 1,
          awayGuess: 0,
          match: {
            id: 'match-1',
            homeScore: 1,
            awayScore: 0,
          },
          pointEntry: { id: 'entry-1', points: 2 },
        },
      ])
      .mockResolvedValueOnce([{ pointEntry: { points: 6 } }]);
    prisma.leaguePointEntry.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    prisma.adminAuditLog.create.mockResolvedValue({});

    await recomputeAdminLeagueScoring({
      actor,
      leagueId: 'global',
      reason: 'Recalculo solicitado',
    });

    expect(prisma.leaguePointEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'entry-1' },
        data: expect.objectContaining({ points: 11 }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { points: 6, streak: 1, misses: 0 },
    });
  });
});
