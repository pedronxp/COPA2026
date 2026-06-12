import { describe, expect, it } from 'vitest';
import {
  formatFeaturedMatchTime,
  selectFeaturedMatches,
} from './landing-match-domain';

const now = new Date('2026-06-11T12:00:00.000Z');

function match(id: string, status: string, kickOff: string) {
  return { id, status, kickOff: new Date(kickOff) };
}

describe('landing featured matches', () => {
  it('shows live matches first and scheduled matches inside 24 hours', () => {
    const result = selectFeaturedMatches([
      match('future-25h', 'scheduled', '2026-06-12T13:00:01.000Z'),
      match('future-24h', 'scheduled', '2026-06-12T12:00:00.000Z'),
      match('live', 'live', '2026-06-11T10:00:00.000Z'),
      match('finished', 'finished', '2026-06-11T09:00:00.000Z'),
      match('future-2h', 'scheduled', '2026-06-11T14:00:00.000Z'),
    ], now);

    expect(result.map((item) => item.id)).toEqual([
      'live',
      'future-2h',
      'future-24h',
    ]);
  });

  it('formats live elapsed time and future countdowns', () => {
    expect(formatFeaturedMatchTime(now, 'live', '37', now)).toBe("Ao vivo - 37'");
    expect(formatFeaturedMatchTime('2026-06-11T14:30:00.000Z', 'scheduled', null, now))
      .toBe('em 2h 30min');
  });
});
