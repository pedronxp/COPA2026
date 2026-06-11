import 'server-only';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ACTIVE_LEAGUE_COOKIE } from '@/lib/active-league-cookie';

export { ACTIVE_LEAGUE_COOKIE };

export interface ActiveLeagueOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: string;
  joinPolicy: string;
  status: string;
  userRole: string;
  userPoints: number;
  userPendingPoints: number;
  userRank: number | null;
  memberCount: number;
  windowHours: number;
  maxEdits: number;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
  lastPublishedAt: string | null;
}

export interface ActiveLeagueContext {
  activeLeague: ActiveLeagueOption;
  options: ActiveLeagueOption[];
  requestedLeague: string | null;
  fallbackReason: string | null;
}

function rankRows(rows: { userId: string; points: number; joinedAt: Date }[]) {
  let previousPoints: number | null = null;
  let sharedRank = 0;

  return rows.map((row, index) => {
    if (row.points !== previousPoints) {
      sharedRank = index + 1;
      previousPoints = row.points;
    }
    return { userId: row.userId, rank: sharedRank };
  });
}

function matchesLeagueReference(league: ActiveLeagueOption, reference: string) {
  const normalized = reference.trim();
  return league.id === normalized || league.slug === normalized;
}

async function getGlobalLeagueOption(userId: string): Promise<ActiveLeagueOption> {
  const [league, user, memberCount, rankedRows] = await Promise.all([
    prisma.league.findUnique({
      where: { id: 'global' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        visibility: true,
        joinPolicy: true,
        status: true,
        windowHours: true,
        maxEdits: true,
        pointsExact: true,
        pointsDiff: true,
        pointsWinner: true,
        pointsWinnerHome: true,
        pointsWinnerAway: true,
        pointsDraw: true,
        lastPublishedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    }),
    prisma.user.count({ where: { NOT: { id: 'system' } } }),
    prisma.user.findMany({
      where: { NOT: { id: 'system' } },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, points: true, createdAt: true },
    }),
  ]);

  const ranking = rankRows(
    rankedRows.map((row) => ({
      userId: row.id,
      points: row.points,
      joinedAt: row.createdAt,
    })),
  );
  const currentRank = ranking.find((row) => row.userId === userId)?.rank ?? null;

  return {
    id: 'global',
    slug: 'global',
    name: league?.name || 'Bolao Global da Copa',
    description:
      league?.description || 'O bolao oficial da plataforma para todos os torcedores.',
    visibility: league?.visibility || 'public',
    joinPolicy: league?.joinPolicy || 'open',
    status: league?.status || 'active',
    userRole: 'member',
    userPoints: user?.points ?? 0,
    userPendingPoints: 0,
    userRank: currentRank,
    memberCount,
    windowHours: league?.windowHours ?? 48,
    maxEdits: league?.maxEdits ?? 3,
    pointsExact: league?.pointsExact ?? 5,
    pointsDiff: league?.pointsDiff ?? 3,
    pointsWinner: league?.pointsWinner ?? 2,
    pointsWinnerHome: league?.pointsWinnerHome ?? 2,
    pointsWinnerAway: league?.pointsWinnerAway ?? 2,
    pointsDraw: league?.pointsDraw ?? 2,
    lastPublishedAt: league?.lastPublishedAt?.toISOString() ?? null,
  };
}

async function getMemberLeagueOptions(userId: string): Promise<ActiveLeagueOption[]> {
  const memberships = await prisma.leagueMember.findMany({
    where: {
      userId,
      status: 'active',
      leagueId: { not: 'global' },
    },
    include: {
      league: {
        include: {
          _count: {
            select: { members: { where: { status: 'active' } } },
          },
        },
      },
    },
    orderBy: { league: { createdAt: 'desc' } },
  });

  if (memberships.length === 0) return [];

  const leagueIds = memberships.map((membership) => membership.leagueId);
  const rankedRows = await prisma.leagueMember.findMany({
    where: { leagueId: { in: leagueIds }, status: 'active' },
    orderBy: [
      { leagueId: 'asc' },
      { points: 'desc' },
      { joinedAt: 'asc' },
      { userId: 'asc' },
    ],
    select: {
      leagueId: true,
      userId: true,
      points: true,
      joinedAt: true,
    },
  });

  const ranksByLeague = new Map<string, { userId: string; rank: number }[]>();
  for (const leagueId of leagueIds) {
    ranksByLeague.set(
      leagueId,
      rankRows(rankedRows.filter((row) => row.leagueId === leagueId)),
    );
  }

  return memberships.map((membership) => {
    const league = membership.league;
    const rank = ranksByLeague
      .get(league.id)
      ?.find((row) => row.userId === userId)?.rank ?? null;

    return {
      id: league.id,
      slug: league.slug || league.id,
      name: league.name,
      description: league.description,
      visibility: league.visibility,
      joinPolicy: league.joinPolicy,
      status: league.status,
      userRole: membership.role,
      userPoints: membership.points,
      userPendingPoints: membership.pendingPoints,
      userRank: rank,
      memberCount: league._count.members,
      windowHours: league.windowHours,
      maxEdits: league.maxEdits,
      pointsExact: league.pointsExact,
      pointsDiff: league.pointsDiff,
      pointsWinner: league.pointsWinner,
      pointsWinnerHome: league.pointsWinnerHome,
      pointsWinnerAway: league.pointsWinnerAway,
      pointsDraw: league.pointsDraw,
      lastPublishedAt: league.lastPublishedAt?.toISOString() ?? null,
    };
  });
}

export async function getActiveLeagueContext(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<ActiveLeagueContext> {
  const requested = Array.isArray(requestedLeague)
    ? requestedLeague[0]
    : requestedLeague?.trim() || null;
  const cookieStore = await cookies();
  const remembered = cookieStore.get(ACTIVE_LEAGUE_COOKIE)?.value?.trim() || null;
  const preferred = requested || remembered || 'global';

  const [globalLeague, memberLeagues] = await Promise.all([
    getGlobalLeagueOption(userId),
    getMemberLeagueOptions(userId),
  ]);
  const options = [globalLeague, ...memberLeagues];
  const activeLeague =
    options.find((league) => matchesLeagueReference(league, preferred)) || globalLeague;

  return {
    activeLeague,
    options,
    requestedLeague: requested,
    fallbackReason:
      requested && !matchesLeagueReference(activeLeague, requested)
        ? 'Voce nao participa deste bolao ou ele nao esta disponivel.'
        : null,
  };
}
