// src/app/api/auth/reset-requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Listar todas as solicitações
export async function GET(request: Request) {
  try {
    const requests = await prisma.passwordResetRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar solicitações.' }, { status: 500 });
  }
}

// Aprovar ou rejeitar uma solicitação
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, action } = body; // action: 'approve' | 'reject'

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    const resetReq = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!resetReq) {
      return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
    }

    if (resetReq.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitação já foi processada.' }, { status: 400 });
    }

    if (action === 'approve') {
      // Atualizar a senha do usuário
      await prisma.user.update({
        where: { id: resetReq.userId },
        data: {
          passwordHash: resetReq.proposedPasswordHash,
        },
      });

      // Atualizar status do pedido
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      });

      return NextResponse.json({ success: true, message: 'Solicitação aprovada e senha atualizada com sucesso!' });
    } else {
      // Rejeitar
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });

      return NextResponse.json({ success: true, message: 'Solicitação rejeitada com sucesso.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar solicitação.' }, { status: 500 });
  }
}
