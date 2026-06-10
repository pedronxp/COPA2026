// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'E-mail e nova senha são obrigatórios.' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    if (!user) {
      return NextResponse.json({ error: 'Nenhum usuário encontrado com este e-mail.' }, { status: 404 });
    }

    // Gerar hash para a nova senha proposta
    const proposedPasswordHash = hashPassword(newPassword);

    // Criar solicitação de redefinição
    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        proposedPasswordHash,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação de alteração de senha enviada com sucesso ao administrador.',
      requestId: resetRequest.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar solicitação.' }, { status: 500 });
  }
}
