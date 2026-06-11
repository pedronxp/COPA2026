const { PrismaClient } = require('@prisma/client');

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
    select: { id: true, name: true, email: true, adminRole: true },
  });

  if (!user) {
    throw new Error(`Usuario nao encontrado: ${email}`);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { adminRole: role },
    select: { id: true, name: true, email: true, adminRole: true },
  });

  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
