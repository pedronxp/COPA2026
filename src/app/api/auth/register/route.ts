import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/session';
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  readStringField,
} from '@/lib/auth-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = readStringField(body, 'name');
    const email = readStringField(body, 'email');
    const password = readStringField(body, 'password');
    const image = readStringField(body, 'image');

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha sao obrigatorios.' }, { status: 400 });
    }

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Informe um e-mail valido e senha com pelo menos 8 caracteres.' },
        { status: 400 },
      );
    }

    const emailNorm = normalizeEmail(email);
    const rateLimit = checkRateLimit(`register:${getClientIp(request)}:${emailNorm}`, {
      limit: 4,
      windowMs: 60 * 60_000,
    });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const existing = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: emailNorm },
      })
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.', code: 'email_already_registered' },
        { status: 400 },
      );
    }

    const user = await withRetry(() =>
      prisma.user.create({
        data: {
          name: name || 'Torcedor',
          email: emailNorm,
          passwordHash: hashPassword(password),
          image: image || 'CDC',
          points: 0,
        },
      })
    );

    let globalLeague = await withRetry(() =>
      prisma.league.findUnique({ where: { id: 'global' } })
    );
    if (!globalLeague) {
      globalLeague = await withRetry(() =>
        prisma.league.create({
          data: {
            id: 'global',
            name: 'Bolão Global da Copa',
            description: 'O bolão oficial da plataforma para todos os torcedores.',
            inviteCode: 'COPA-GLOBAL',
            ownerId: user.id,
            expiresAt: new Date('2026-08-01T00:00:00Z'),
          },
        })
      );
    }

    await withRetry(() =>
      prisma.leagueMember.upsert({
        where: {
          leagueId_userId: { leagueId: 'global', userId: user.id },
        },
        update: {},
        create: {
          leagueId: globalLeague.id,
          userId: user.id,
          role: 'member',
          points: 0,
        },
      })
    );

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
    const message = error instanceof Error ? error.message : 'Erro no cadastro.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
