import type { Match, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  deriveRankingCycle,
  type GroupPublicationMode,
  type KnockoutPublicationMode,
} from '@/lib/league-domain';

type DbClient = Prisma.TransactionClient;

export function getCycleKey(
  league: {
    groupPublicationMode: string;
    knockoutPublicationMode: string;
  },
  match: Pick<Match, 'id' | 'stage' | 'matchday'>,
) {
  return deriveRankingCycle({
    matchId: match.id,
    stage: match.stage,
    matchday: match.matchday,
    groupMode: league.groupPublicationMode as GroupPublicationMode,
    knockoutMode: league.knockoutPublicationMode as KnockoutPublicationMode,
  });
}

async function isCycleComplete(
  db: DbClient,
  league: {
    groupPublicationMode: string;
    knockoutPublicationMode: string;
  },
  match: Pick<Match, 'id' | 'stage' | 'matchday'>,
) {
  if (match.stage === 'group') {
    const mode = league.groupPublicationMode;
    if (mode === 'manual') return false;
    if (mode === 'match') return true;

    const round = Number.parseInt(match.matchday || '', 10);
    if (mode === 'phase') {
      return (await db.match.count({ where: { stage: 'group', status: { not: 'finished' } } })) === 0;
    }

    if (!Number.isInteger(round)) return false;
    const size = mode === 'every_2_rounds' ? 2 : mode === 'every_3_rounds' ? 3 : 1;
    const start = Math.floor((round - 1) / size) * size + 1;
    const end = start + size - 1;
    const matches = await db.match.findMany({
      where: {
        stage: 'group',
        matchday: { in: Array.from({ length: size }, (_, index) => String(start + index)) },
      },
      select: { status: true },
    });

    if (matches.length === 0 || matches.some((item) => item.status !== 'finished')) return false;
    if (mode === 'round') return true;

    const knownRounds = await db.match.findMany({
      where: { stage: 'group', matchday: { not: null } },
      distinct: ['matchday'],
      select: { matchday: true },
    });
    const maximumRound = Math.max(
      0,
      ...knownRounds.map((item) => Number.parseInt(item.matchday || '0', 10) || 0),
    );
    return round >= Math.min(end, maximumRound);
  }

  if (league.knockoutPublicationMode === 'manual') return false;
  if (league.knockoutPublicationMode === 'match') return true;

  return (
    (await db.match.count({
      where: { stage: match.stage, status: { not: 'finished' } },
    })) === 0
  );
}

async function buildSnapshots(db: DbClient, leagueId: string, cycleId: string) {
  const members = await db.leagueMember.findMany({
    where: { leagueId, status: 'active' },
    orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
    select: { userId: true, points: true },
  });
  const cyclePoints = await db.leaguePointEntry.groupBy({
    by: ['userId'],
    where: { leagueId, cycleKey: (await db.leagueRankingCycle.findUniqueOrThrow({ where: { id: cycleId } })).key },
    _sum: { points: true },
  });
  const cyclePointsByUser = new Map(
    cyclePoints.map((item) => [item.userId, item._sum.points || 0]),
  );

  let previousPoints: number | null = null;
  let sharedRank = 0;
  const snapshots = members.map((member, index) => {
    if (previousPoints !== member.points) {
      sharedRank = index + 1;
      previousPoints = member.points;
    }
    return {
      leagueId,
      cycleId,
      userId: member.userId,
      rank: sharedRank,
      cyclePoints: cyclePointsByUser.get(member.userId) || 0,
      totalPoints: member.points,
    };
  });

  if (snapshots.length > 0) {
    await db.leagueRankingSnapshot.createMany({ data: snapshots });
  }
}

export async function publishLeagueCycle(leagueId: string, cycleKey: string) {
  return prisma.$transaction(
    async (tx) => {
      const cycle = await tx.leagueRankingCycle.upsert({
        where: { leagueId_key: { leagueId, key: cycleKey } },
        create: { leagueId, key: cycleKey, status: 'pending' },
        update: {},
      });
      const claimed = await tx.leagueRankingCycle.updateMany({
        where: { id: cycle.id, status: 'pending' },
        data: { status: 'publishing' },
      });
      if (claimed.count === 0) return false;

      const totals = await tx.leaguePointEntry.groupBy({
        by: ['userId'],
        where: { leagueId, cycleKey, status: 'pending' },
        _sum: { points: true },
      });

      for (const total of totals) {
        const points = total._sum.points || 0;
        await tx.leagueMember.updateMany({
          where: { leagueId, userId: total.userId, status: 'active' },
          data: {
            points: { increment: points },
            pendingPoints: { decrement: points },
          },
        });
      }

      const publishedAt = new Date();
      await tx.leaguePointEntry.updateMany({
        where: { leagueId, cycleKey, status: 'pending' },
        data: { status: 'published', publishedAt },
      });
      await tx.leagueRankingCycle.update({
        where: { id: cycle.id },
        data: { status: 'published', publishedAt },
      });
      await tx.league.update({
        where: { id: leagueId },
        data: { lastPublishedAt: publishedAt },
      });
      await buildSnapshots(tx, leagueId, cycle.id);
      return true;
    },
    { isolationLevel: 'Serializable' },
  );
}

export async function publishReadyCyclesForMatch(
  match: Pick<Match, 'id' | 'stage' | 'matchday'>,
  leagueIds: string[],
) {
  for (const leagueId of new Set(leagueIds)) {
    if (leagueId === 'global') continue;
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        groupPublicationMode: true,
        knockoutPublicationMode: true,
      },
    });
    if (!league) continue;
    const ready = await prisma.$transaction((tx) => isCycleComplete(tx, league, match));
    if (ready) {
      await publishLeagueCycle(leagueId, getCycleKey(league, match));
    }
  }
}
