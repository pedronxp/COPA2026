import { describe, expect, it } from 'vitest';
import { deriveSyncHealth } from './sync-health';

const schedule = {
  enabled: true,
  intervalMinutes: 30,
  lastStatus: 'success',
  lastError: null,
  lastAttemptAt: null,
};

describe('deriveSyncHealth', () => {
  it('distinguishes backup data from a healthy API response', () => {
    const health = deriveSyncHealth(
      {
        syncedAt: new Date('2026-06-11T12:00:00Z'),
        status: 'degraded',
        source: 'backup',
        error: 'Timeout',
      },
      schedule,
      new Date('2026-06-11T12:05:00Z'),
    );

    expect(health.state).toBe('degraded');
    expect(health.detail).toBe('Timeout');
  });

  it('marks a successful but delayed sync as stale', () => {
    const health = deriveSyncHealth(
      {
        syncedAt: new Date('2026-06-11T10:00:00Z'),
        status: 'success',
        source: 'worldcup26',
      },
      schedule,
      new Date('2026-06-11T12:00:01Z'),
    );

    expect(health.state).toBe('stale');
  });
});
