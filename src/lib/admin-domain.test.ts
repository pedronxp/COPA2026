import { describe, expect, it } from 'vitest';
import { getAccountRestriction, hasAdminPermission, isAdminRole } from './admin-domain';

describe('admin domain', () => {
  it('identifies platform admin roles', () => {
    expect(isAdminRole('support')).toBe(true);
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('owner')).toBe(false);
    expect(isAdminRole('none')).toBe(false);
  });

  it('enforces role permissions', () => {
    expect(hasAdminPermission('support', 'resets:manage')).toBe(true);
    expect(hasAdminPermission('support', 'matches:operate')).toBe(false);
    expect(hasAdminPermission('moderator', 'users:moderate')).toBe(true);
    expect(hasAdminPermission('super_admin', 'matches:operate')).toBe(true);
  });

  it('reports active account restrictions', () => {
    expect(getAccountRestriction('active')).toBeNull();
    expect(getAccountRestriction('banned')).toMatch(/banida/);
    expect(getAccountRestriction('blocked')).toMatch(/bloqueada/);
    expect(getAccountRestriction('suspended', new Date(Date.now() + 60_000))).toMatch(
      /suspensa/,
    );
    expect(getAccountRestriction('suspended', new Date(Date.now() - 60_000))).toBeNull();
  });
});
