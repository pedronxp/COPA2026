import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  readStringField,
} from './auth-validation';

describe('auth validation', () => {
  it('normalizes e-mail input', () => {
    expect(normalizeEmail(' USER@Example.COM ')).toBe('user@example.com');
  });

  it('validates basic e-mail and password rules', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('1234567')).toBe(false);
  });

  it('reads only string fields', () => {
    expect(readStringField({ email: ' a@b.com ' }, 'email')).toBe('a@b.com');
    expect(readStringField({ email: 123 }, 'email')).toBe('');
  });
});
