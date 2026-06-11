import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { decidePasswordResetRequest, listPasswordResetRequests } from '@/lib/admin-service';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminApi('resets:manage');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const requests = await listPasswordResetRequests(searchParams.get('status'));

    return NextResponse.json(requests);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Erro ao listar solicitacoes.') },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi('resets:manage');
    if (auth.response) return auth.response;

    const body = await request.json();
    const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
    const action = typeof body?.action === 'string' ? body.action : '';
    const reason = typeof body?.reason === 'string' ? body.reason : '';

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parametros invalidos.' }, { status: 400 });
    }

    await decidePasswordResetRequest({
      actor: auth.user,
      requestId,
      action: action as 'approve' | 'reject',
      reason,
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Solicitacao aprovada.' : 'Solicitacao rejeitada.',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Erro ao processar solicitacao.') },
      { status: 500 },
    );
  }
}
