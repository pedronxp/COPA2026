import { describe, expect, it } from 'vitest';
import { withPrismaPoolLimits } from './database-url';

describe('withPrismaPoolLimits', () => {
  it('adds conservative defaults without replacing existing query settings', () => {
    const result = withPrismaPoolLimits(
      'postgresql://user:pass@host/db?sslmode=require',
    );
    const url = new URL(result);

    expect(url.searchParams.get('sslmode')).toBe('require');
    expect(url.searchParams.get('connection_limit')).toBe('3');
    expect(url.searchParams.get('pool_timeout')).toBe('20');
  });

  it('respects explicit deployment settings', () => {
    const result = withPrismaPoolLimits(
      'postgresql://user:pass@host/db?connection_limit=5&pool_timeout=30',
    );
    const url = new URL(result);

    expect(url.searchParams.get('connection_limit')).toBe('5');
    expect(url.searchParams.get('pool_timeout')).toBe('30');
  });
});
