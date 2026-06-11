import { describe, expect, it } from 'vitest';
import {
  createLeagueSlug,
  deriveRankingCycle,
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
    expect(result.pointsExact).toBe(5);
    expect(result.maxMembers).toBe(50);
  });

  it('rejects member limits above 50', () => {
    expect(() =>
      validateLeagueConfiguration({ name: 'Liga Cheia', maxMembers: 51 }),
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
});
