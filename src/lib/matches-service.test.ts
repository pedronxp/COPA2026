import { describe, expect, it } from 'vitest';
import {
  calculatePredictionPoints,
  calculatePredictionScore,
} from './matches-service';

const rules = {
  pointsExact: 8,
  pointsDiff: 4,
  pointsWinner: 2,
  pointsDraw: 3,
  pointsBothScoreYes: 1,
  pointsBothScoreNo: 2,
};

describe('calculatePredictionPoints', () => {
  it('awards exact score plus independently derived market points', () => {
    expect(calculatePredictionPoints(2, 1, 2, 1, rules)).toBe(15);
  });

  it('awards only the matching derived markets when the exact score misses', () => {
    expect(calculatePredictionPoints(3, 1, 2, 0, rules)).toBe(2);
  });

  it('awards winner points', () => {
    expect(calculatePredictionPoints(1, 0, 4, 2, rules)).toBe(2);
  });

  it('awards non-exact draw and matching independent markets', () => {
    expect(calculatePredictionPoints(1, 1, 2, 2, rules)).toBe(8);
  });

  it('awards zero for the wrong outcome', () => {
    expect(calculatePredictionPoints(1, 1, 0, 1, rules)).toBe(0);
  });

  it('awards both-teams-do-not-score and total-goals markets independently', () => {
    expect(calculatePredictionPoints(1, 0, 1, 0, rules)).toBe(16);
  });

  it('returns a scoring breakdown for UI and audits', () => {
    expect(calculatePredictionScore(2, 1, 2, 1, rules)).toMatchObject({
      total: 15,
      base: 14,
      baseKind: 'exact',
      bothTeamsScore: 1,
      bothTeamsScoreKind: 'yes',
      exact: true,
    });
  });
});
