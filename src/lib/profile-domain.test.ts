import { describe, expect, it } from 'vitest';
import { parseProfileUpdate } from './profile-domain';

describe('parseProfileUpdate', () => {
  it('normalizes a valid profile update', () => {
    expect(parseProfileUpdate({ name: '  Pedro Alves  ', image: 'CDC' })).toEqual({
      name: 'Pedro Alves',
      image: 'CDC',
    });
  });

  it('rejects invalid names', () => {
    expect(() => parseProfileUpdate({ name: 'P', image: 'CDC' })).toThrow(
      /entre 2 e 60/,
    );
  });

  it('rejects avatars outside the allowlist', () => {
    expect(() => parseProfileUpdate({ name: 'Pedro', image: '<img>' })).toThrow(
      /avatar permitido/,
    );
  });
});
