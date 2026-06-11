import { describe, expect, it } from 'vitest';
import { calculatePredictionPoints } from './matches-service';

const rules = {
  pointsExact: 8,
  pointsDiff: 4,
  pointsWinner: 2,
  pointsDraw: 3,
};

describe('calculatePredictionPoints', () => {
  it('awards exact-score points', () => {
    expect(calculatePredictionPoints(2, 1, 2, 1, rules)).toBe(8);
  });

  it('awards goal-difference points', () => {
    expect(calculatePredictionPoints(3, 1, 2, 0, rules)).toBe(4);
  });

  it('awards winner points', () => {
    expect(calculatePredictionPoints(1, 0, 4, 2, rules)).toBe(2);
  });

  it('awards non-exact draw points', () => {
    expect(calculatePredictionPoints(1, 1, 2, 2, rules)).toBe(3);
  });

  it('awards zero for the wrong outcome', () => {
    expect(calculatePredictionPoints(1, 0, 0, 1, rules)).toBe(0);
  });
});
