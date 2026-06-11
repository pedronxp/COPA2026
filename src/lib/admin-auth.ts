import 'server-only';

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, type SessionUser } from '@/lib/session';
import { hasAdminPermission, type AdminPermission } from '@/lib/admin-domain';

export {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  getAccountRestriction,
  hasAdminPermission,
  isAdminRole,
  type AdminPermission,
  type AdminRole,
} from '@/lib/admin-domain';

type AdminAuthResult =
  | { user: SessionUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireAdminApi(
  permission: AdminPermission = 'dashboard:view',
): Promise<AdminAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 }),
    };
  }

  if (!hasAdminPermission(user.adminRole, permission)) {
    return {
      response: NextResponse.json({ error: 'Acesso administrativo negado.' }, { status: 403 }),
    };
  }

  return { user };
}

export async function requireAdminPage(permission: AdminPermission = 'dashboard:view') {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/admin')}`);
  }

  if (!hasAdminPermission(user.adminRole, permission)) {
    redirect('/dashboard');
  }

  return user;
}

export async function recordAdminAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      summary: input.summary,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}
