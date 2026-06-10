// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Usuário não encontrado ou senha não cadastrada.' }, { status: 400 });
    }

    // Verificar senha
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        points: user.points,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no login.' }, { status: 500 });
  }
}
