export const ADMIN_ROLES = ['support', 'moderator', 'operator', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  'dashboard:view',
  'resets:manage',
  'users:moderate',
  'leagues:manage',
  'matches:operate',
  'audit:view',
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  support: new Set(['dashboard:view', 'resets:manage', 'audit:view']),
  moderator: new Set(['dashboard:view', 'users:moderate', 'audit:view']),
  operator: new Set(['dashboard:view', 'matches:operate', 'leagues:manage', 'audit:view']),
  super_admin: new Set(ADMIN_PERMISSIONS),
};

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function hasAdminPermission(
  role: string | null | undefined,
  permission: AdminPermission,
) {
  return isAdminRole(role) && ROLE_PERMISSIONS[role].has(permission);
}

export function getAccountRestriction(
  accountStatus: string | null | undefined,
  suspendedUntil?: Date | string | null,
) {
  const status = accountStatus || 'active';
  const suspendedDate = suspendedUntil ? new Date(suspendedUntil) : null;

  if (status === 'banned') return 'Conta banida.';
  if (status === 'blocked') return 'Conta bloqueada para acoes protegidas.';
  if (status === 'suspended') {
    if (!suspendedDate || suspendedDate > new Date()) {
      return 'Conta suspensa temporariamente.';
    }
  }

  return null;
}
