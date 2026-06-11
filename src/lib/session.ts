import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session-constants';

export { SESSION_COOKIE_NAME };

const SESSION_TTL_DAYS = 7;

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  points: number;
  streak: number;
  misses: number;
  adminRole: string;
  accountStatus: string;
  suspendedUntil: Date | null;
}

function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1017'].includes(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('connection pool') || msg.includes('timed out') || msg.includes('econnreset');
  }
  return false;
}

export function getSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  };
}

export async function createSession(userId: string) {
  const sessionToken = generateToken();
  const expires = getSessionExpiry();

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return { sessionToken, expires };
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            points: true,
            streak: true,
            misses: true,
            adminRole: true,
            accountStatus: true,
            suspendedUntil: true,
          },
        },
      },
    });

    if (!session || session.expires <= new Date() || session.revokedAt) {
      await prisma.session.deleteMany({ where: { sessionToken } });
      return null;
    }

    return session.user;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.warn('Database unavailable while reading session.', error);
      return null;
    }
    throw error;
  }
}

export async function requireUser(nextPath?: string) {
  const user = await getCurrentUser();

  if (!user) {
    const loginPath = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login';
    redirect(loginPath);
  }

  return user;
}
