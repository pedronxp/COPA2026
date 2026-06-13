import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, tx } = vi.hoisted(() => {
  const txMock = {
    league: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
    leagueMember: {
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    prediction: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    leaguePointEntry: {
      findMany: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
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

describe('league owner unlimited edit service', () => {
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
    
    // Mocks padrão para o recompute service não estourar erro
    tx.prediction.findMany.mockResolvedValue([]);
    tx.leagueMember.findMany.mockResolvedValue([]);
    tx.leaguePointEntry.aggregate.mockResolvedValue({ _sum: { points: 0 } });
  });

  it('allows saving owner edits multiple times', async () => {
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
        where: { id: 'league-1' },
        data: expect.objectContaining({
          name: 'Liga Nova',
          editedByOwner: true,
          ownerEditUsedAt: expect.any(Date),
          ownerEditUsedById: 'owner-1',
        }),
      }),
    );
  });

  it('allows competitive rule changes and recomputes scoring retroactively', async () => {
    const league = baseLeague();
    tx.league.findFirst.mockResolvedValue(league);
    tx.league.findUniqueOrThrow.mockResolvedValue({
      ...league,
      pointsExact: 7,
      editedByOwner: true,
    });

    await updateLeague('liga-teste', 'owner-1', { pointsExact: 7 });

    // Deve acionar o recálculo retroativo
    expect(tx.prediction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ leagueId: 'league-1' }),
      }),
    );
  });

  it('does not trigger recompute if only general fields change', async () => {
    const league = baseLeague();
    tx.league.findFirst.mockResolvedValue(league);
    tx.league.findUniqueOrThrow.mockResolvedValue({
      ...league,
      name: 'Nome Diferente',
    });

    await updateLeague('liga-teste', 'owner-1', { name: 'Nome Diferente' });

    // Não deve chamar findMany de prediction, pois nenhuma regra competitiva mudou
    expect(tx.prediction.findMany).not.toHaveBeenCalled();
  });
});
