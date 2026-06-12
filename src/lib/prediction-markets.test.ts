import { describe, expect, it } from 'vitest';
import {
  deriveTotalGoalsPick,
  isTotalGoalsPickCorrect,
  parsePredictionMarketPicks,
} from './prediction-markets';

describe('prediction markets', () => {
  it('validates complete required market picks', () => {
    expect(
      parsePredictionMarketPicks({
        resultPick: 'draw',
        totalGoalsPick: 'under_1_5',
        bothTeamsScorePick: 'no',
      }),
    ).toEqual({
      resultPick: 'draw',
      totalGoalsPick: 'under_1_5',
      bothTeamsScorePick: 'no',
    });
  });

  it('rejects unsupported total-goals picks', () => {
    expect(() =>
      parsePredictionMarketPicks({
        resultPick: 'home',
        totalGoalsPick: 'over_6_5',
        bothTeamsScorePick: 'yes',
      }),
    ).toThrow(/total de gols/i);
  });

  it('keeps over 5.5+ open ended', () => {
    expect(isTotalGoalsPickCorrect('over_5_5_plus', 6)).toBe(true);
    expect(isTotalGoalsPickCorrect('over_5_5_plus', 9)).toBe(true);
    expect(isTotalGoalsPickCorrect('over_5_5_plus', 5)).toBe(false);
  });

  it('derives the highest legacy total-goals bucket for old high-score predictions', () => {
    expect(deriveTotalGoalsPick(4, 3)).toBe('over_5_5_plus');
  });
});
