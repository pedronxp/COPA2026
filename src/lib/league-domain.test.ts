import { describe, expect, it } from 'vitest';
import {
  createLeagueSlug,
  deriveOwnerEditState,
  deriveRankingCycle,
  hasCompetitiveLeagueChange,
  validateLeagueConfiguration,
} from './league-domain';

describe('league domain', () => {
  it('creates stable ascii slugs', () => {
    expect(createLeagueSlug('Bolao da Familia Sao Joao')).toBe(
      'bolao-da-familia-sao-joao',
    );
  });

  it('applies public defaults and standard scoring', () => {
    const result = validateLeagueConfiguration({
      name: 'Liga Publica',
      visibility: 'public',
    });
    expect(result.joinPolicy).toBe('open');
    expect(result.visualTheme).toBe('pulse');
    expect(result.pointsExact).toBe(5);
    expect(result.pointsBothScoreYes).toBe(1);
    expect(result.pointsBothScoreNo).toBe(1);
    expect(result.maxMembers).toBe(50);
  });

  it('accepts visual theme and both-teams-score settings', () => {
    const result = validateLeagueConfiguration({
      name: 'Liga Tematica',
      visualTheme: 'stadium',
      pointsBothScoreYes: 4,
      pointsBothScoreNo: 1,
    });

    expect(result.visualTheme).toBe('stadium');
    expect(result.pointsBothScoreYes).toBe(4);
    expect(result.pointsBothScoreNo).toBe(1);
  });

  it('rejects member limits above 10000', () => {
    expect(() =>
      validateLeagueConfiguration({ name: 'Liga Cheia', maxMembers: 10001 }),
    ).toThrow(/maxMembers/);
  });

  it('derives two-round group cycles', () => {
    expect(
      deriveRankingCycle({
        matchId: 'match-1',
        stage: 'group',
        matchday: '2',
        groupMode: 'every_2_rounds',
        knockoutMode: 'stage',
      }),
    ).toBe('group:1-2');
  });

  it('derives knockout stage cycles', () => {
    expect(
      deriveRankingCycle({
        matchId: 'match-80',
        stage: 'qf',
        matchday: null,
        groupMode: 'round',
        knockoutMode: 'stage',
      }),
    ).toBe('stage:qf');
  });

  it('exposes owner edit availability before consumption', () => {
    expect(
      deriveOwnerEditState({
        ownerEditUsedAt: null,
        ownerEditUsedById: null,
        rulesLockedAt: null,
      }),
    ).toMatchObject({
      available: true,
      lockReason: null,
      usedAt: null,
      usedById: null,
    });
  });

  it('returns polished lock copy after the owner edit is consumed', () => {
    const usedAt = new Date('2026-06-13T12:00:00Z');

    expect(
      deriveOwnerEditState({
        ownerEditUsedAt: usedAt,
        ownerEditUsedById: 'owner-1',
        rulesLockedAt: null,
      }),
    ).toMatchObject({
      available: true,
      lockReason: null,
      usedAt: null,
      usedById: null,
    });
  });

  it('detects prediction-lock precedence for competitive changes', () => {
    const state = deriveOwnerEditState({
      ownerEditUsedAt: null,
      ownerEditUsedById: null,
      rulesLockedAt: new Date('2026-06-13T12:00:00Z'),
      requestedCompetitiveChange: true,
    });

    expect(state).toMatchObject({
      available: true,
      lockReason: null,
    });
  });

  it('detects competitive field changes only when values really change', () => {
    const current = {
      name: 'Bolão Original',
      pointsExact: 5,
      expiresAt: new Date('2026-08-01T00:00:00Z'),
    };

    expect(
      hasCompetitiveLeagueChange(
        { name: 'Bolão Novo', pointsExact: 5 },
        current,
        { ...current, name: 'Bolão Novo' },
      ),
    ).toBe(false);

    expect(
      hasCompetitiveLeagueChange(
        { pointsExact: 7 },
        current,
        { ...current, pointsExact: 7 },
      ),
    ).toBe(true);
  });
});
