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
  it('awards exact-score points', () => {
    expect(calculatePredictionPoints(2, 1, 2, 1, rules)).toBe(9);
  });

  it('awards goal-difference points', () => {
    expect(calculatePredictionPoints(3, 1, 2, 0, rules)).toBe(4);
  });

  it('awards winner points', () => {
    expect(calculatePredictionPoints(1, 0, 4, 2, rules)).toBe(2);
  });

  it('awards non-exact draw points', () => {
    expect(calculatePredictionPoints(1, 1, 2, 2, rules)).toBe(4);
  });

  it('awards zero for the wrong outcome', () => {
    expect(calculatePredictionPoints(1, 1, 0, 1, rules)).toBe(0);
  });

  it('awards both-teams-do-not-score bonus independently', () => {
    expect(calculatePredictionPoints(1, 0, 1, 0, rules)).toBe(10);
  });

  it('returns a scoring breakdown for UI and audits', () => {
    expect(calculatePredictionScore(2, 1, 2, 1, rules)).toMatchObject({
      total: 9,
      base: 8,
      baseKind: 'exact',
      bothTeamsScore: 1,
      bothTeamsScoreKind: 'yes',
      exact: true,
    });
  });
});
