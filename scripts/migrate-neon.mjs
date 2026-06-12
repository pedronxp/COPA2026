import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const TARGET_DATABASE = process.env.TARGET_DATABASE || 'copa2026_app';
const sourceUrl = process.env.LEGACY_DIRECT_URL || process.env.LEGACY_DATABASE_URL;

if (!sourceUrl) {
  throw new Error(
    'Defina LEGACY_DIRECT_URL ou LEGACY_DATABASE_URL com a conexao do banco Neon antigo.',
  );
}

function databaseUrl(rawUrl, databaseName) {
  const url = new URL(rawUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

async function withClient(url, operation) {
  const client = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    return await operation(client);
  } finally {
    await client.$disconnect();
  }
}

async function ensureTargetDatabase() {
  await withClient(sourceUrl, async (source) => {
    const databases = await source.$queryRawUnsafe(
      'SELECT datname FROM pg_database WHERE datname = $1',
      TARGET_DATABASE,
    );
    if (databases.length === 0) {
      const escapedName = TARGET_DATABASE.replaceAll('"', '""');
      await source.$executeRawUnsafe(`CREATE DATABASE "${escapedName}"`);
      console.log(`Database ${TARGET_DATABASE} criada.`);
    } else {
      console.log(`Database ${TARGET_DATABASE} ja existe.`);
    }
  });
}

function applyPrismaSchema(targetUrl) {
  const prismaCli = resolve('node_modules/prisma/build/index.js');
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'db', 'push', '--skip-generate'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: targetUrl,
        DIRECT_URL: targetUrl,
      },
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Falha ao aplicar o schema Prisma.');
  }
  console.log('Schema Prisma aplicado no banco de destino.');
}

async function readLegacyUsers() {
  return withClient(sourceUrl, (source) =>
    source.$queryRawUnsafe(`
      SELECT id, name, email, password, role, total_points
      FROM public.users
      ORDER BY id
    `),
  );
}

async function migrateUsers(targetUrl, legacyUsers) {
  await withClient(targetUrl, async (target) => {
    const systemUser = await target.user.upsert({
      where: { email: 'sistema@copa.com' },
      update: {},
      create: {
        id: 'system',
        name: 'Sistema',
        email: 'sistema@copa.com',
        image: 'SYS',
      },
    });

    const globalLeague = await target.league.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        slug: 'global',
        name: 'Bolao Global da Copa',
        description: 'O bolao oficial da plataforma para todos os torcedores.',
        inviteCode: 'COPA-GLOBAL',
        ownerId: systemUser.id,
        visibility: 'public',
        joinPolicy: 'open',
        expiresAt: new Date('2026-08-01T00:00:00Z'),
      },
    });

    for (const legacy of legacyUsers) {
      const user = await target.user.upsert({
        where: { email: String(legacy.email).trim().toLowerCase() },
        update: {
          name: legacy.name || 'Torcedor',
          passwordHash: legacy.password,
          points: Number(legacy.total_points) || 0,
        },
        create: {
          id: `legacy-${legacy.id}`,
          name: legacy.name || 'Torcedor',
          email: String(legacy.email).trim().toLowerCase(),
          passwordHash: legacy.password,
          points: Number(legacy.total_points) || 0,
          image: 'CDC',
          adminRole: legacy.role === 'admin' ? 'super_admin' : 'none',
        },
      });

      await target.leagueMember.upsert({
        where: {
          leagueId_userId: {
            leagueId: globalLeague.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          leagueId: globalLeague.id,
          userId: user.id,
          role: 'member',
          points: Number(legacy.total_points) || 0,
        },
      });
    }
  });
}

await ensureTargetDatabase();
const targetUrl = databaseUrl(sourceUrl, TARGET_DATABASE);
applyPrismaSchema(targetUrl);
const legacyUsers = await readLegacyUsers();
await migrateUsers(targetUrl, legacyUsers);

console.log(
  JSON.stringify({
    targetDatabase: TARGET_DATABASE,
    migratedUsers: legacyUsers.length,
  }),
);
