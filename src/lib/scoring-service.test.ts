import { describe, expect, it } from 'vitest';
import { summarizeGlobalPerformance } from './scoring-service';

describe('summarizeGlobalPerformance', () => {
  it('recomputes points and the current hit streak', () => {
    expect(
      summarizeGlobalPerformance([{ points: 5 }, { points: 2 }, { points: 3 }]),
    ).toEqual({ points: 10, streak: 3, misses: 0 });
  });

  it('resets hits and counts consecutive misses', () => {
    expect(
      summarizeGlobalPerformance([
        { points: 5 },
        { points: 0 },
        { points: 0 },
      ]),
    ).toEqual({ points: 5, streak: 0, misses: 2 });
  });

  it('restarts the hit streak after a miss', () => {
    expect(
      summarizeGlobalPerformance([
        { points: 0 },
        { points: 2 },
        { points: 4 },
      ]),
    ).toEqual({ points: 6, streak: 2, misses: 0 });
  });
});
