import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  readStringField,
} from '@/lib/auth-validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const GENERIC_RESET_RESPONSE = {
  success: true,
  message: 'Se o e-mail existir, a solicitacao sera enviada ao administrador.',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = readStringField(body, 'email');
    const newPassword = readStringField(body, 'newPassword');

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'E-mail e nova senha sao obrigatorios.' }, { status: 400 });
    }

    if (!isValidEmail(email) || !isValidPassword(newPassword)) {
      return NextResponse.json({ error: 'Dados invalidos para solicitacao.' }, { status: 400 });
    }

    const emailNorm = normalizeEmail(email);
    const rateLimit = checkRateLimit(`forgot:${getClientIp(request)}:${emailNorm}`, {
      limit: 5,
      windowMs: 15 * 60_000,
    });
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (!user) {
      return NextResponse.json(GENERIC_RESET_RESPONSE);
    }

    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        proposedPasswordHash: hashPassword(newPassword),
        status: 'pending',
      },
    });

    return NextResponse.json(GENERIC_RESET_RESPONSE);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar solicitacao.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
