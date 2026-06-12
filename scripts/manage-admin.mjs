import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const allowedRoles = new Set(['none', 'support', 'moderator', 'operator', 'super_admin']);

async function main() {
  const [, , emailArg, roleArg = 'super_admin'] = process.argv;
  const email = (emailArg || '').trim().toLowerCase();
  const role = (roleArg || '').trim();

  if (!email || !email.includes('@')) {
    throw new Error('Uso: npm run admin:role -- usuario@email.com [role]');
  }
  if (!allowedRoles.has(role)) {
    throw new Error(`Role invalida. Use: ${[...allowedRoles].join(', ')}`);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      adminRole: true,
      accountStatus: true,
    },
  });

  if (!user) {
    throw new Error(`Usuario nao encontrado: ${email}`);
  }
  if (role !== 'none' && user.accountStatus !== 'active') {
    throw new Error('A conta precisa estar ativa para receber acesso administrativo.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({
      where: { id: user.id },
      data: { adminRole: role },
      select: { id: true, name: true, email: true, adminRole: true },
    });

    await tx.adminAuditLog.create({
      data: {
        action: 'admin_role_changed',
        entityType: 'user',
        entityId: user.id,
        summary: `Permissao administrativa de ${email} alterada de ${user.adminRole} para ${role}.`,
        metadata: {
          previousRole: user.adminRole,
          newRole: role,
          source: 'manage-admin-cli',
        },
      },
    });

    return result;
  });

  console.log(JSON.stringify({
    ...updated,
    previousRole: user.adminRole,
    auditRecorded: true,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
