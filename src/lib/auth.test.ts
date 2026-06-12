import { hashSync } from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  isLegacyPasswordHash,
  verifyPassword,
} from './auth';

describe('password compatibility', () => {
  it('verifies the current scrypt format', () => {
    const hash = hashPassword('senha-segura');

    expect(isLegacyPasswordHash(hash)).toBe(false);
    expect(verifyPassword('senha-segura', hash)).toBe(true);
    expect(verifyPassword('senha-incorreta', hash)).toBe(false);
  });

  it('verifies legacy bcrypt hashes so login can rehash them', () => {
    const hash = hashSync('senha-legada', 4);

    expect(isLegacyPasswordHash(hash)).toBe(true);
    expect(verifyPassword('senha-legada', hash)).toBe(true);
    expect(verifyPassword('senha-incorreta', hash)).toBe(false);
  });
});
