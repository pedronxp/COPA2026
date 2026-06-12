import { describe, expect, it } from 'vitest';
import {
  diffAdminLeagueRules,
  disableOptionalScoringRules,
  parseAdminLeagueRules,
  parseAdminRuleImpactMode,
  type AdminLeagueRuleInput,
} from './admin-pool-governance-domain';

const fallback: AdminLeagueRuleInput = {
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

describe('admin pool governance domain', () => {
  it('parses valid scoring rule edits', () => {
    expect(
      parseAdminLeagueRules(
        {
          scoringPreset: 'custom',
          scoringStartMatchday: 2,
          windowHours: 24,
          maxEdits: 1,
          pointsExact: 8,
          groupPublicationMode: 'round',
        },
        fallback,
      ),
    ).toMatchObject({
      scoringPreset: 'custom',
      scoringStartMatchday: 2,
      windowHours: 24,
      maxEdits: 1,
      pointsExact: 8,
      groupPublicationMode: 'round',
    });
  });

  it('rejects invalid ranges', () => {
    expect(() =>
      parseAdminLeagueRules({ pointsExact: -1 }, fallback),
    ).toThrow(/pointsExact/);
    expect(() =>
      parseAdminLeagueRules({ windowHours: 999 }, fallback),
    ).toThrow(/windowHours/);
  });

  it('disables optional scoring rules without deleting required rules', () => {
    expect(disableOptionalScoringRules(fallback)).toMatchObject({
      scoringPreset: 'custom',
      pointsExact: 5,
      pointsBothScoreYes: 0,
      pointsBothScoreNo: 0,
    });
  });

  it('detects rule changes and validates impact modes', () => {
    const after = { ...fallback, pointsExact: 7 };
    expect(diffAdminLeagueRules(fallback, after)).toEqual(['pointsExact']);
    expect(parseAdminRuleImpactMode('future_only')).toBe('future_only');
    expect(() => parseAdminRuleImpactMode('silent')).toThrow(/impacto/);
  });
});
