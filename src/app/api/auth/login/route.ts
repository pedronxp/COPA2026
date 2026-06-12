import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { hashPassword, isLegacyPasswordHash, verifyPassword } from '@/lib/auth';
import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/session';
import { isValidEmail, normalizeEmail, readStringField } from '@/lib/auth-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getAccountRestriction } from '@/lib/admin-domain';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = readStringField(body, 'email');
    const password = readStringField(body, 'password');

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha sao obrigatorios.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 400 });
    }

    const emailNorm = normalizeEmail(email);
    const rateLimit = checkRateLimit(`login:${getClientIp(request)}:${emailNorm}`, {
      limit: 8,
      windowMs: 15 * 60_000,
    });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: emailNorm },
      })
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com esse e-mail. Crie uma conta para continuar.', code: 'user_not_found' },
        { status: 400 },
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Senha incorreta. Verifique e tente novamente.', code: 'invalid_credentials' },
        { status: 400 },
      );
    }

    if (isLegacyPasswordHash(user.passwordHash)) {
      await withRetry(() =>
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashPassword(password) },
        })
      );
    }

    const restriction = getAccountRestriction(user.accountStatus, user.suspendedUntil);
    if (restriction && user.accountStatus !== 'blocked') {
      return NextResponse.json({ error: restriction, code: 'account_restricted' }, { status: 403 });
    }

    const { sessionToken, expires } = await createSession(user.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        points: user.points,
        streak: user.streak,
        misses: user.misses,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expires));
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro no login.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
