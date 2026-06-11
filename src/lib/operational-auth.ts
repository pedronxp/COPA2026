import { NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/session';
import { requireAdminApi, type AdminPermission } from '@/lib/admin-auth';

export function requireOperationalSecret(request: Request) {
  if (process.env.NODE_ENV !== 'production') return null;

  const expected = process.env.OPERATIONS_SECRET;
  const provided =
    request.headers.get('x-operations-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: 'Operacao nao autorizada.' }, { status: 403 });
  }
  return null;
}

export async function requireOperationalRequest(
  request: Request,
  permission: AdminPermission = 'matches:operate',
) {
  if (process.env.NODE_ENV !== 'production') return null;

  const expected = process.env.OPERATIONS_SECRET;
  const provided =
    request.headers.get('x-operations-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (expected && provided && provided === expected) {
    return null;
  }

  const auth = await requireAdminApi(permission);
  return auth.response || null;
}

type OperationalAuthResult =
  | { user: SessionUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireOperationalUser(request: Request): Promise<OperationalAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 }) };
  }

  const forbidden = requireOperationalSecret(request);
  if (forbidden) return { response: forbidden };

  return { user };
}
