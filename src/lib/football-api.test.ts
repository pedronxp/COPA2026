import { afterEach, describe, expect, it, vi } from 'vitest';
import backupData from './backup-data.json';
import {
  fetchFootballSnapshot,
  validateGames,
  validateTeams,
} from './football-api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('football API snapshot', () => {
  it('validates the expected World Cup payload sizes', () => {
    expect(validateGames(backupData.games)).toHaveLength(104);
    expect(validateTeams(backupData.teams)).toHaveLength(48);
  });

  it('rejects incomplete game payloads', () => {
    expect(() => validateGames(backupData.games.slice(0, 103))).toThrow(
      '104 partidas',
    );
  });

  it('uses one atomic backup snapshot when either primary endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/get/games')) {
        return new Response(JSON.stringify({ games: backupData.games }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ teams: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }));

    const result = await fetchFootballSnapshot();

    expect(result.source).toBe('backup');
    expect(result.games).toHaveLength(104);
    expect(result.teams).toHaveLength(48);
    expect(result.error).toContain('48 selecoes');
  });
});
