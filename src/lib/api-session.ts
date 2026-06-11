import { NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from '@/lib/session';
import { getAccountRestriction } from '@/lib/admin-domain';

type ApiAuthResult =
  | { user: SessionUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireApiUser(): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 }),
    };
  }

  const restriction = getAccountRestriction(user.accountStatus, user.suspendedUntil);
  if (restriction) {
    return {
      response: NextResponse.json({ error: restriction }, { status: 403 }),
    };
  }

  return { user };
}
