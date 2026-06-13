import 'server-only';

import { prisma, withRetry } from '@/lib/prisma';
import type {
  BothTeamsScorePick,
  ResultPick,
  TotalGoalsPick,
} from '@/lib/prediction-markets';
import { normalizePredictionMarketPicks } from '@/lib/prediction-markets';

export interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    points: number;
    streak: number;
    misses: number;
    adminRole: string;
  };
  globalRanking: {
    rank: number | null;
    memberCount: number;
    topFive: Array<{
      id: string;
      name: string;
      image: string | null;
      points: number;
      rank: number;
    }>;
  };
  stats: {
    totalPredictions: number;
    processedPredictions: number;
    exactScores: number;
  };
  leagues: Array<{
    id: string;
    slug: string;
    name: string;
    role: string;
    points: number;
    pendingPoints: number;
    status: string;
  }>;
  recentPredictions: Array<{
    id: string;
    leagueName: string;
    leagueSlug: string;
    homeGuess: number;
    awayGuess: number;
    resultPick: ResultPick;
    totalGoalsPick: TotalGoalsPick;
    bothTeamsScorePick: BothTeamsScorePick;
    processed: boolean;
    points: number | null;
    kickOff: string;
    matchStatus: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
  }>;
}

function rankGlobalUsers<T extends { id: string; points: number }>(users: T[]) {
  let previousPoints: number | null = null;
  let sharedRank = 0;

  return users.map((user, index) => {
    if (user.points !== previousPoints) {
      sharedRank = index + 1;
      previousPoints = user.points;
    }
    return { ...user, rank: sharedRank };
  });
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const [
    user,
    globalUsers,
    memberships,
    recentPredictions,
    totalPredictions,
    processedPredictions,
  ] = await Promise.all([
    withRetry(() =>
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
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
    ),
    withRetry(() =>
      prisma.user.findMany({
        where: { NOT: { id: 'system' } },
        orderBy: [{ points: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          image: true,
          points: true,
        },
      }),
    ),
    withRetry(() =>
      prisma.leagueMember.findMany({
        where: { userId, status: 'active' },
        orderBy: [{ joinedAt: 'asc' }],
        select: {
          role: true,
          points: true,
          pendingPoints: true,
          league: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
            },
          },
        },
      }),
    ),
    withRetry(() =>
      prisma.prediction.findMany({
        where: { userId },
        orderBy: { match: { kickOff: 'desc' } },
        take: 6,
        select: {
          id: true,
          homeGuess: true,
          awayGuess: true,
          resultPick: true,
          totalGoalsPick: true,
          bothTeamsScorePick: true,
          processed: true,
          pointEntry: { select: { points: true } },
          league: { select: { name: true, slug: true, id: true } },
          match: {
            select: {
              kickOff: true,
              status: true,
              homeTeam: true,
              awayTeam: true,
              homeScore: true,
              awayScore: true,
            },
          },
        },
      }),
    ),
    withRetry(() => prisma.prediction.count({ where: { userId } })),
    withRetry(() =>
      prisma.prediction.findMany({
        where: {
          userId,
          processed: true,
          match: {
            status: 'finished',
            homeScore: { not: null },
            awayScore: { not: null },
          },
        },
        select: {
          homeGuess: true,
          awayGuess: true,
          match: { select: { homeScore: true, awayScore: true } },
        },
      }),
    ),
  ]);

  const rankedUsers = rankGlobalUsers(globalUsers);
  const currentRank = rankedUsers.find((entry) => entry.id === userId)?.rank ?? null;
  const exactScores = processedPredictions.filter(
    (prediction) =>
      prediction.homeGuess === prediction.match.homeScore &&
      prediction.awayGuess === prediction.match.awayScore,
  ).length;

  return {
    user: {
      id: user.id,
      name: user.name || 'Torcedor',
      email: user.email,
      image: user.image || 'CDC',
      points: user.points,
      streak: user.streak,
      misses: user.misses,
      adminRole: user.adminRole,
    },
    globalRanking: {
      rank: currentRank,
      memberCount: rankedUsers.length,
      topFive: rankedUsers.slice(0, 5).map((entry) => ({
        id: entry.id,
        name: entry.name || 'Usuario',
        image: entry.image,
        points: entry.points,
        rank: entry.rank,
      })),
    },
    stats: {
      totalPredictions,
      processedPredictions: processedPredictions.length,
      exactScores,
    },
    leagues: memberships.map((membership) => ({
      id: membership.league.id,
      slug: membership.league.slug || membership.league.id,
      name: membership.league.name,
      role: membership.role,
      points:
        membership.league.id === 'global' ? user.points : membership.points,
      pendingPoints:
        membership.league.id === 'global' ? 0 : membership.pendingPoints,
      status: membership.league.status,
    })),
    recentPredictions: recentPredictions.map((prediction) => ({
      ...normalizePredictionMarketPicks(prediction),
      id: prediction.id,
      leagueName: prediction.league.name,
      leagueSlug: prediction.league.slug || prediction.league.id,
      homeGuess: prediction.homeGuess,
      awayGuess: prediction.awayGuess,
      processed: prediction.processed,
      points: prediction.pointEntry?.points ?? null,
      kickOff: prediction.match.kickOff.toISOString(),
      matchStatus: prediction.match.status,
      homeTeam: prediction.match.homeTeam,
      awayTeam: prediction.match.awayTeam,
      homeScore: prediction.match.homeScore,
      awayScore: prediction.match.awayScore,
    })),
  };
}

export async function getUserPublicProfile(targetUserId: string, viewerUserId: string) {
  const [user, targetMemberships, globalPredictions] = await Promise.all([
    withRetry(() =>
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          image: true,
          points: true,
          streak: true,
          misses: true,
        },
      })
    ),
    withRetry(() =>
      prisma.leagueMember.findMany({
        where: { userId: targetUserId, status: 'active' },
        select: {
          role: true,
          points: true,
          league: {
            select: {
              id: true,
              slug: true,
              name: true,
              visibility: true,
              status: true,
              members: {
                where: { userId: viewerUserId, status: 'active' },
                select: { id: true },
              },
            },
          },
        },
      })
    ),
    withRetry(() =>
      prisma.prediction.findMany({
        where: { userId: targetUserId, leagueId: 'global' },
        include: {
          match: {
            select: {
              status: true,
              homeScore: true,
              awayScore: true,
            },
          },
          pointEntry: {
            select: { points: true },
          },
        },
      })
    ),
  ]);

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const visibleLeagues = targetMemberships
    .filter(
      (m) =>
        m.league.visibility === 'public' ||
        m.league.id === 'global' ||
        m.league.members.length > 0
    )
    .map((m) => ({
      id: m.league.id,
      slug: m.league.slug || m.league.id,
      name: m.league.name,
      role: m.role,
      points: m.league.id === 'global' ? user.points : m.points,
      status: m.league.status,
    }));

  const totalPredictions = globalPredictions.length;
  const processedPredictions = globalPredictions.filter((p) => p.processed).length;
  const correctPredictions = globalPredictions.filter(
    (p) => p.processed && (p.pointEntry?.points ?? 0) > 0
  ).length;

  const exactScores = globalPredictions.filter(
    (p) =>
      p.processed &&
      p.homeGuess === p.match.homeScore &&
      p.awayGuess === p.match.awayScore
  ).length;

  const accuracyPercentage =
    processedPredictions > 0
      ? Math.round((correctPredictions / processedPredictions) * 100)
      : 0;

  return {
    user: {
      id: user.id,
      name: user.name || 'Torcedor',
      image: user.image || '⚽',
      points: user.points,
      streak: user.streak,
      misses: user.misses,
    },
    leagues: visibleLeagues,
    stats: {
      totalPredictions,
      processedPredictions,
      exactScores,
      accuracyPercentage,
    },
  };
}

