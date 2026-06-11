import { describe, expect, it } from 'vitest';
import { parseMatchLocalDate } from './match-time';

describe('parseMatchLocalDate', () => {
  it('converts Mexico City kickoff to 16:00 in Sao Paulo', () => {
    const kickOff = parseMatchLocalDate('06/11/2026 13:00', '1');

    expect(kickOff.toISOString()).toBe('2026-06-11T19:00:00.000Z');
    expect(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(kickOff),
    ).toBe('16:00');
  });

  it('applies daylight saving time for a United States central venue', () => {
    const kickOff = parseMatchLocalDate('06/17/2026 15:00', '4');

    expect(kickOff.toISOString()).toBe('2026-06-17T20:00:00.000Z');
  });
});
