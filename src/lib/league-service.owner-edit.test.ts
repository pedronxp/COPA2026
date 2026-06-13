import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, tx } = vi.hoisted(() => {
  const txMock = {
    league: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    leagueMember: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    prediction: {
      count: vi.fn(),
    },
  };

  return {
    tx: txMock,
    prisma: {
      $transaction: vi.fn(),
      ...txMock,
    },
  };
});

vi.mock('@/lib/prisma', () => ({ prisma }));

import { updateLeague } from './league-service';

function baseLeague(overrides: Record<string, unknown> = {}) {
  return {
    id: 'league-1',
    slug: 'liga-teste',
    name: 'Liga Teste',
    description: null,
    visibility: 'private',
    joinPolicy: 'invite',
    status: 'active',
    maxMembers: 50,
    visualTheme: 'pulse',
    scoringPreset: 'standard',
    scoringStartMatchday: 1,
    groupPublicationMode: 'match',
    knockoutPublicationMode: 'match',
    expiresAt: new Date('2026-08-01T00:00:00Z'),
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
    rulesLockedAt: null,
    lastPublishedAt: null,
    editedByOwner: false,
    ownerEditUsedAt: null,
    ownerEditUsedById: null,
    updatedAt: new Date('2026-06-13T12:00:00Z'),
    ...overrides,
  };
}

describe('league owner one-time edit service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operation) => operation(tx));
    tx.leagueMember.findFirst.mockResolvedValue({
      leagueId: 'league-1',
      userId: 'owner-1',
      role: 'owner',
      status: 'active',
    });
    tx.leagueMember.count.mockResolvedValue(1);
    tx.prediction.count.mockResolvedValue(0);
    tx.league.updateMany.mockResolvedValue({ count: 1 });
  });

  it('consumes the owner edit when the first valid edit is saved', async () => {
    const league = baseLeague();
    tx.league.findFirst.mockResolvedValue(league);
    tx.league.findUniqueOrThrow.mockResolvedValue({
      ...league,
      name: 'Liga Nova',
      editedByOwner: true,
      ownerEditUsedAt: new Date('2026-06-13T13:00:00Z'),
      ownerEditUsedById: 'owner-1',
    });

    await expect(
      updateLeague('liga-teste', 'owner-1', { name: 'Liga Nova' }),
    ).resolves.toMatchObject({
      name: 'Liga Nova',
      ownerEditUsedById: 'owner-1',
    });

    expect(tx.league.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'league-1', ownerEditUsedAt: null },
        data: expect.objectContaining({
          name: 'Liga Nova',
          editedByOwner: true,
          ownerEditUsedAt: expect.any(Date),
          ownerEditUsedById: 'owner-1',
        }),
      }),
    );
  });

  it('rejects direct owner edit requests after the allowance is consumed', async () => {
    tx.league.findFirst.mockResolvedValue(
      baseLeague({
        ownerEditUsedAt: new Date('2026-06-13T13:00:00Z'),
        ownerEditUsedById: 'owner-1',
      }),
    );

    await expect(
      updateLeague('liga-teste', 'owner-1', { name: 'Outra Liga' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'OWNER_EDIT_USED',
    });
    expect(tx.league.updateMany).not.toHaveBeenCalled();
  });

  it('rejects competitive rule changes when predictions already locked rules', async () => {
    tx.league.findFirst.mockResolvedValue(
      baseLeague({
        rulesLockedAt: new Date('2026-06-13T13:00:00Z'),
      }),
    );

    await expect(
      updateLeague('liga-teste', 'owner-1', { pointsExact: 7 }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'RULES_LOCKED',
    });
    expect(tx.league.updateMany).not.toHaveBeenCalled();
  });

  it('still allows a one-time general edit when only competitive rules are locked', async () => {
    const league = baseLeague({
      rulesLockedAt: new Date('2026-06-13T13:00:00Z'),
    });
    tx.league.findFirst.mockResolvedValue(league);
    tx.league.findUniqueOrThrow.mockResolvedValue({
      ...league,
      name: 'Liga Geral Nova',
      ownerEditUsedAt: new Date('2026-06-13T14:00:00Z'),
      ownerEditUsedById: 'owner-1',
    });

    await updateLeague('liga-teste', 'owner-1', { name: 'Liga Geral Nova' });

    expect(tx.prediction.count).not.toHaveBeenCalled();
    expect(tx.league.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Liga Geral Nova' }),
      }),
    );
  });
});
