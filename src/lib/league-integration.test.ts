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

      expect(member.points).toBe(5);
      expect(member.pendingPoints).toBe(0);
      expect(entries).toHaveLength(1);
      expect(entries[0].points).toBe(5);
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
});
