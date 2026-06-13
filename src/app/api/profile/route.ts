import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getProfileData, getUserPublicProfile } from '@/lib/profile-service';
import { parseProfileUpdate } from '@/lib/profile-domain';
import { prisma, withRetry } from '@/lib/prisma';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  if (targetUserId) {
    try {
      const publicProfile = await getUserPublicProfile(targetUserId, user.id);
      return NextResponse.json({ profile: publicProfile });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar perfil público.';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ profile: await getProfileData(user.id) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (user.accountStatus !== 'active') {
    return NextResponse.json(
      { error: 'Conta sem permissão para atualizar o perfil.' },
      { status: 403 },
    );
  }

  try {
    const update = parseProfileUpdate(await request.json());
    const updated = await withRetry(() =>
      prisma.user.update({
        where: { id: user.id },
        data: update,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          points: true,
          streak: true,
          misses: true,
          adminRole: true,
        },
      }),
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
