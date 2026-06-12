import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

try {
  loadEnvFile('.env');
} catch {
  // Vitest may run in environments where .env is already loaded or absent.
}

const integration = process.env.DATABASE_URL ? describe : describe.skip;

let db: (typeof import('./prisma'))['prisma'];
let createLeagueFn: (typeof import('./league-service'))['createLeague'];
let joinLeagueFn: (typeof import('./league-service'))['joinLeague'];
let getLeagueDetailFn: (typeof import('./league-service'))['getLeagueDetail'];
let savePredictionFn: (typeof import('./prediction-service'))['saveLeaguePrediction'];
let processScoringFn: (typeof import('./scoring-service'))['processLeagueScoringForMatch'];
let deleteAdminLeagueFn: (typeof import('./admin-service'))['deleteAdminLeague'];
let deleteUsersBatchFn: (typeof import('./admin-service'))['deleteUsersBatch'];

async function createTestUser(prefix: string, label: string) {
  return db.user.create({
    data: {
      name: `Codex ${label}`,
      email: `${prefix}-${label}@example.com`,
      image: null,
    },
  });
}

async function cleanup(prefix: string, matchIds: string[] = []) {
  if (matchIds.length > 0) {
    await db.match.deleteMany({ where: { id: { in: matchIds } } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
}

beforeAll(async () => {
  ({ prisma: db } = await import('./prisma'));
  ({
    createLeague: createLeagueFn,
    joinLeague: joinLeagueFn,
    getLeagueDetail: getLeagueDetailFn,
  } = await import('./league-service'));
  ({ saveLeaguePrediction: savePredictionFn } = await import('./prediction-service'));
  ({ processLeagueScoringForMatch: processScoringFn } = await import('./scoring-service'));
  ({ deleteAdminLeague: deleteAdminLeagueFn, deleteUsersBatch: deleteUsersBatchFn } = await import('./admin-service'));
});

afterAll(async () => {
  await db?.$disconnect();
});

integration('league integration', () => {
  it('keeps capacity under concurrent open joins', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    await cleanup(prefix);

    try {
      const [owner, first, second] = await Promise.all([
        createTestUser(prefix, 'owner'),
        createTestUser(prefix, 'first'),
        createTestUser(prefix, 'second'),
      ]);
      const league = await createLeagueFn(owner.id, {
        name: `Liga Concorrente ${prefix}`,
        visibility: 'public',
        joinPolicy: 'open',
        maxMembers: 2,
      });

      const results = await Promise.allSettled([
        joinLeagueFn(first.id, { reference: league.slug || league.id }),
        joinLeagueFn(second.id, { reference: league.slug || league.id }),
      ]);

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

      const activeMembers = await db.leagueMember.count({
        where: { leagueId: league.id, status: 'active' },
      });
      expect(activeMembers).toBe(2);
    } finally {
      await cleanup(prefix);
    }
  });

  it('keeps scoring idempotent when processing the same finished match twice', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    const matchIds: string[] = [];
    await cleanup(prefix);

    try {
      const owner = await createTestUser(prefix, 'owner');
      const league = await createLeagueFn(owner.id, {
        name: `Liga Idempotente ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
        groupPublicationMode: 'match',
      });
      const match = await db.match.create({
        data: {
          homeTeam: 'Casa',
          awayTeam: 'Fora',
          kickOff: new Date(Date.now() - 60 * 60 * 1000),
          homeScore: 2,
          awayScore: 1,
          status: 'finished',
          stage: 'group',
          matchday: '1',
        },
      });
      matchIds.push(match.id);
      await db.prediction.create({
        data: {
          userId: owner.id,
          leagueId: league.id,
          matchId: match.id,
          homeGuess: 2,
          awayGuess: 1,
        },
      });

      await processScoringFn(match.id);
      await processScoringFn(match.id);

      const member = await db.leagueMember.findUniqueOrThrow({
        where: { leagueId_userId: { leagueId: league.id, userId: owner.id } },
      });
      const entries = await db.leaguePointEntry.findMany({
        where: { leagueId: league.id, userId: owner.id, matchId: match.id },
      });

      expect(member.points).toBe(6);
      expect(member.pendingPoints).toBe(0);
      expect(member.exactScoreStreak).toBe(1);
      expect(member.bestExactScoreStreak).toBe(1);
      expect(entries).toHaveLength(1);
      expect(entries[0].points).toBe(6);
    } finally {
      await cleanup(prefix, matchIds);
    }
  });

  it('tracks exact-score streaks inside the selected league', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    const matchIds: string[] = [];
    await cleanup(prefix);

    try {
      const owner = await createTestUser(prefix, 'owner');
      const league = await createLeagueFn(owner.id, {
        name: `Liga Sequencia ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
        groupPublicationMode: 'match',
      });
      const matches = await Promise.all(
        [0, 1, 2].map((index) =>
          db.match.create({
            data: {
              homeTeam: `Casa ${index}`,
              awayTeam: `Fora ${index}`,
              kickOff: new Date(Date.now() - (3 - index) * 60 * 60 * 1000),
              homeScore: 1,
              awayScore: 0,
              status: 'finished',
              stage: 'group',
              matchday: String(index + 1),
            },
          }),
        ),
      );
      matchIds.push(...matches.map((match) => match.id));
      await Promise.all(
        matches.map((match) =>
          db.prediction.create({
            data: {
              userId: owner.id,
              leagueId: league.id,
              matchId: match.id,
              homeGuess: 1,
              awayGuess: 0,
            },
          }),
        ),
      );

      for (const match of matches) {
        await processScoringFn(match.id);
      }

      const member = await db.leagueMember.findUniqueOrThrow({
        where: { leagueId_userId: { leagueId: league.id, userId: owner.id } },
      });

      expect(member.exactScoreStreak).toBe(3);
      expect(member.bestExactScoreStreak).toBe(3);
    } finally {
      await cleanup(prefix, matchIds);
    }
  }, 20_000);

  it('recomputes global points and miss streak after a result correction', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    const matchIds: string[] = [];
    await cleanup(prefix);

    try {
      const user = await createTestUser(prefix, 'global-score');
      await db.leagueMember.create({
        data: {
          leagueId: 'global',
          userId: user.id,
          role: 'member',
          status: 'active',
        },
      });
      const matches = await Promise.all([
        db.match.create({
          data: {
            homeTeam: 'Casa Global 1',
            awayTeam: 'Fora Global 1',
            kickOff: new Date(Date.now() - 2 * 60 * 60 * 1000),
            homeScore: 2,
            awayScore: 1,
            status: 'finished',
            stage: 'group',
            matchday: '1',
          },
        }),
        db.match.create({
          data: {
            homeTeam: 'Casa Global 2',
            awayTeam: 'Fora Global 2',
            kickOff: new Date(Date.now() - 60 * 60 * 1000),
            homeScore: 0,
            awayScore: 1,
            status: 'finished',
            stage: 'group',
            matchday: '1',
          },
        }),
      ]);
      matchIds.push(...matches.map((match) => match.id));
      await Promise.all([
        db.prediction.create({
          data: {
            userId: user.id,
            leagueId: 'global',
            matchId: matches[0].id,
            homeGuess: 2,
            awayGuess: 1,
          },
        }),
        db.prediction.create({
          data: {
            userId: user.id,
            leagueId: 'global',
            matchId: matches[1].id,
            homeGuess: 1,
            awayGuess: 0,
          },
        }),
      ]);

      await processScoringFn(matches[0].id);
      await processScoringFn(matches[1].id);
      await db.match.update({
        where: { id: matches[0].id },
        data: { homeScore: 0, awayScore: 2 },
      });
      await processScoringFn(matches[0].id);

      const updated = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      const scoreEntries = await db.leaguePointEntry.findMany({
        where: {
          leagueId: 'global',
          userId: user.id,
          predictionId: { not: null },
        },
      });

      expect(updated).toMatchObject({ points: 0, streak: 0, misses: 2 });
      expect(scoreEntries).toHaveLength(2);
      expect(scoreEntries.every((entry) => entry.points === 0)).toBe(true);
    } finally {
      await cleanup(prefix, matchIds);
    }
  });

  it('keeps private league details restricted for non-members', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    await cleanup(prefix);

    try {
      const [owner, outsider] = await Promise.all([
        createTestUser(prefix, 'owner'),
        createTestUser(prefix, 'outsider'),
      ]);
      const league = await createLeagueFn(owner.id, {
        name: `Liga Privada ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
      });

      const restricted = await getLeagueDetailFn(league.slug || league.id, outsider.id);
      const ownerView = await getLeagueDetailFn(league.slug || league.id, owner.id);

      expect(restricted).toMatchObject({
        id: league.id,
        access: 'restricted',
        visibility: 'private',
      });
      expect('inviteCode' in restricted).toBe(false);
      expect(ownerView).toMatchObject({
        id: league.id,
        access: 'member',
        userRole: 'owner',
      });
      expect('inviteCode' in ownerView ? ownerView.inviteCode : null).toBeTruthy();
    } finally {
      await cleanup(prefix);
    }
  });

  it('rejects predictions from users outside the selected league', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    const matchIds: string[] = [];
    await cleanup(prefix);

    try {
      const [owner, outsider] = await Promise.all([
        createTestUser(prefix, 'owner'),
        createTestUser(prefix, 'outsider'),
      ]);
      const league = await createLeagueFn(owner.id, {
        name: `Liga Membership ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
      });
      const match = await db.match.create({
        data: {
          homeTeam: 'Casa',
          awayTeam: 'Fora',
          kickOff: new Date(Date.now() + 60 * 60 * 1000),
          status: 'scheduled',
          stage: 'group',
          matchday: '1',
        },
      });
      matchIds.push(match.id);

      await expect(
        savePredictionFn({
          userId: outsider.id,
          leagueId: league.id,
          matchId: match.id,
          homeGuess: 1,
          awayGuess: 0,
        }),
      ).rejects.toThrow(/participar deste bol/);

      await expect(
        savePredictionFn({
          userId: owner.id,
          leagueId: league.id,
          matchId: match.id,
          homeGuess: 1,
          awayGuess: 0,
        }),
      ).resolves.toMatchObject({
        userId: owner.id,
        leagueId: league.id,
        matchId: match.id,
      });
    } finally {
      await cleanup(prefix, matchIds);
    }
  });

  it('allows administrators to delete leagues and cascades associated records', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    await cleanup(prefix);

    try {
      const owner = await createTestUser(prefix, 'owner');
      const adminActor = {
        id: owner.id,
        email: owner.email,
        adminRole: 'super_admin',
        accountStatus: 'active',
        name: owner.name,
        image: owner.image,
        points: owner.points,
        streak: owner.streak,
        misses: owner.misses,
        suspendedUntil: owner.suspendedUntil,
      };

      const league = await createLeagueFn(owner.id, {
        name: `Liga Para Deletar ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
      });

      // Validar que a liga existe no banco
      const leagueBefore = await db.league.findUnique({ where: { id: league.id } });
      expect(leagueBefore).not.toBeNull();

      // Deletar a liga
      const deleteResult = await deleteAdminLeagueFn({
        actor: adminActor,
        leagueId: league.id,
        reason: 'Teste de delecao de bolao',
      });

      expect(deleteResult.deleted).toBe(true);

      // Validar que a liga foi excluida do banco
      const leagueAfter = await db.league.findUnique({ where: { id: league.id } });
      expect(leagueAfter).toBeNull();

      // Validar que membros associados foram deletados em cascata
      const members = await db.leagueMember.findMany({ where: { leagueId: league.id } });
      expect(members).toHaveLength(0);
    } finally {
      await cleanup(prefix);
    }
  });

  it('allows deletion of users who own leagues and cascades the deletion to their leagues', async () => {
    const prefix = `codex-it-${randomUUID()}`;
    await cleanup(prefix);

    try {
      const [adminUser, owner] = await Promise.all([
        createTestUser(prefix, 'admin'),
        createTestUser(prefix, 'owner'),
      ]);
      const adminActor = {
        id: adminUser.id,
        email: adminUser.email,
        adminRole: 'super_admin',
        accountStatus: 'active',
        name: adminUser.name,
        image: adminUser.image,
        points: adminUser.points,
        streak: adminUser.streak,
        misses: adminUser.misses,
        suspendedUntil: adminUser.suspendedUntil,
      };

      const league = await createLeagueFn(owner.id, {
        name: `Liga Cascata Usuario ${prefix}`,
        visibility: 'private',
        joinPolicy: 'invite',
      });

      // Validar que o usuario e a liga existem
      const userBefore = await db.user.findUnique({ where: { id: owner.id } });
      const leagueBefore = await db.league.findUnique({ where: { id: league.id } });
      expect(userBefore).not.toBeNull();
      expect(leagueBefore).not.toBeNull();

      // Deletar o usuario em lote
      const deleteResult = await deleteUsersBatchFn({
        actor: adminActor,
        userIds: [owner.id],
        reason: 'Teste de delecao de usuario com cascata de bolao',
      });

      expect(deleteResult.deleted).toBe(1);

      // Validar que o usuario foi deletado
      const userAfter = await db.user.findUnique({ where: { id: owner.id } });
      expect(userAfter).toBeNull();

      // Validar que a liga dele foi deletada em cascata pelo banco de dados
      const leagueAfter = await db.league.findUnique({ where: { id: league.id } });
      expect(leagueAfter).toBeNull();
    } finally {
      await cleanup(prefix);
    }
  });
});
