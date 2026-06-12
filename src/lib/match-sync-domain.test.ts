import { describe, expect, it } from 'vitest';
import {
  mergeMatchSyncState,
  normalizeMatchStatus,
} from './match-sync-domain';

describe('match sync state', () => {
  it('normalizes external status fields', () => {
    expect(normalizeMatchStatus('FALSE', 'notstarted')).toBe('scheduled');
    expect(normalizeMatchStatus('FALSE', '37')).toBe('live');
    expect(normalizeMatchStatus('TRUE', 'finished')).toBe('finished');
  });

  it('does not regress a live match to scheduled', () => {
    const current = {
      status: 'live',
      elapsed: '37',
      homeScore: 1,
      awayScore: 0,
    };

    expect(mergeMatchSyncState(current, {
      status: 'scheduled',
      elapsed: 'notstarted',
      homeScore: null,
      awayScore: null,
    })).toEqual(current);
  });

  it('does not regress a finished match or erase its score', () => {
    const current = {
      status: 'finished',
      elapsed: 'finished',
      homeScore: 2,
      awayScore: 1,
    };

    expect(mergeMatchSyncState(current, {
      status: 'live',
      elapsed: '80',
      homeScore: 1,
      awayScore: 1,
    })).toEqual(current);
  });

  it('accepts score corrections that remain finished', () => {
    expect(mergeMatchSyncState({
      status: 'finished',
      elapsed: 'finished',
      homeScore: 1,
      awayScore: 0,
    }, {
      status: 'finished',
      elapsed: 'finished',
      homeScore: 2,
      awayScore: 0,
    })).toMatchObject({
      status: 'finished',
      homeScore: 2,
      awayScore: 0,
    });
  });
});
