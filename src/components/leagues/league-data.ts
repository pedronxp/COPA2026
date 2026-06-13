import 'server-only';

import { prisma } from '@/lib/prisma';
import type {
  LeagueCardData,
  LeagueDetailData,
  LeagueRankingEntry,
  LeagueRole,
} from './league-types';
import { deriveOwnerEditState } from '@/lib/league-domain';

const activeMembership = { status: 'active' };

function displayName(name: string | null) {
  return name?.trim() || 'Competidor';
}

function serializeMember(member: {
  userId: string;
  role: string;
  points: number;
  pendingPoints: number;
  exactScoreStreak: number;
  bestExactScoreStreak: number;
  joinedAt: Date;
  user: { name: string | null; image: string | null };
}): LeagueRankingEntry {
  return {
    id: member.userId,
    name: displayName(member.user.name),
    image: member.user.image,
    role: member.role as LeagueRole,
    points: member.points,
    pendingPoints: member.pendingPoints,
    exactScoreStreak: member.exactScoreStreak,
    bestExactScoreStreak: member.bestExactScoreStreak,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function rankForUser(ranking: LeagueRankingEntry[], userId: string) {
  const index = ranking.findIndex((member) => member.id === userId);
  return index >= 0 ? index + 1 : null;
}

function serializeOwnerEdit(league: {
  ownerEditUsedAt: Date | null;
  ownerEditUsedById: string | null;
  rulesLockedAt?: Date | null;
}) {
  const state = deriveOwnerEditState({
    ownerEditUsedAt: league.ownerEditUsedAt,
    ownerEditUsedById: league.ownerEditUsedById,
    rulesLockedAt: league.rulesLockedAt ?? null,
  });

  return {
    available: state.available,
    usedAt: state.usedAt?.toISOString() ?? null,
    usedById: state.usedById,
    rulesLocked: state.rulesLocked,
    lockReason: state.lockReason,
    lockMessage: state.lockMessage,
  };
}

type LeagueWithMembers = Awaited<ReturnType<typeof getOverviewRows>>[number];

async function getOverviewRows(userId: string) {
  return prisma.league.findMany({
    where: {
      id: { not: 'global' },
      OR: [
        { visibility: 'public', status: { in: ['active', 'closed'] } },
        { members: { some: { userId, ...activeMembership } } },
      ],
    },
    include: {
      owner: { select: { name: true, image: true } },
      members: {
        where: activeMembership,
        orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }],
        select: {
          userId: true,
          role: true,
          points: true,
          pendingPoints: true,
          exactScoreStreak: true,
          bestExactScoreStreak: true,
          joinedAt: true,
          user: { select: { name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

function serializeCard(league: LeagueWithMembers, userId: string): LeagueCardData {
  const ranking = league.members.map(serializeMember);
  const membership = ranking.find((member) => member.id === userId) ?? null;

  return {
    id: league.id,
    slug: league.slug || league.id,
    name: league.name,
    description: league.description,
    visibility: league.visibility,
    joinPolicy: league.joinPolicy,
    status: league.status,
    maxMembers: league.maxMembers,
    visualTheme: league.visualTheme,
    memberCount: ranking.length,
    ownerName: displayName(league.owner.name),
    ownerImage: league.owner.image,
    userRole: membership?.role ?? null,
    userPoints: membership?.points ?? null,
    userRank: rankForUser(ranking, userId),
    leader: ranking[0] ?? null,
    rankingPreview: ranking.slice(0, 3),
    scoringPreset: league.scoringPreset,
    pointsExact: league.pointsExact,
    pointsDiff: league.pointsDiff,
    pointsWinner: league.pointsWinner,
    pointsWinnerHome: league.pointsWinnerHome,
    pointsWinnerAway: league.pointsWinnerAway,
    pointsDraw: league.pointsDraw,
    pointsBothScoreYes: league.pointsBothScoreYes,
    pointsBothScoreNo: league.pointsBothScoreNo,
    lastPublishedAt: league.lastPublishedAt?.toISOString() ?? null,
    editedByOwner: league.editedByOwner,
    ownerEdit: serializeOwnerEdit(league),
    ownerEditUsedAt: league.ownerEditUsedAt?.toISOString() ?? null,
    ownerEditUsedById: league.ownerEditUsedById,
  };
}

export async function getLeaguesOverview(userId: string) {
  const leagues = await getOverviewRows(userId);
  
  const nowTime = Date.now();
  const limitTime = new Date(nowTime + 30 * 60 * 1000); // kickOff - 30min no futuro

  // Buscar todas as partidas que ainda aceitam palpite ou vão aceitar
  const activeMatches = await prisma.match.findMany({
    where: {
      status: 'scheduled',
      kickOff: {
        gt: limitTime,
      },
    },
    select: {
      id: true,
      kickOff: true,
    },
  });

  // Buscar todas as previsões do usuário para estas partidas
  const userPredictions = await prisma.prediction.findMany({
    where: {
      userId,
      matchId: {
        in: activeMatches.map((m) => m.id),
      },
    },
    select: {
      matchId: true,
      leagueId: true,
    },
  });

  const cards = leagues.map((league) => {
    const card = serializeCard(league, userId);
    
    if (card.userRole && league.status === 'active') {
      let pendingCount = 0;
      for (const match of activeMatches) {
        const kickOffTime = new Date(match.kickOff).getTime();
        const openTime = kickOffTime - league.windowHours * 60 * 60 * 1000;
        const limitTimeVal = kickOffTime - 30 * 60 * 1000;
        
        // Verifica se a janela de palpite está aberta
        const isWindowOpen = nowTime >= openTime && nowTime <= limitTimeVal;
        
        if (isWindowOpen) {
          // Verifica se o usuário tem palpite para este jogo nesta liga
          const hasPrediction = userPredictions.some(
            (p) => p.matchId === match.id && p.leagueId === league.id
          );
          if (!hasPrediction) {
            pendingCount++;
          }
        }
      }
      card.pendingPredictionsCount = pendingCount;
    } else {
      card.pendingPredictionsCount = 0;
    }
    
    return card;
  });

  return {
    mine: cards.filter((league) => league.userRole),
    discover: cards.filter((league) => league.visibility === 'public' && !league.userRole),
  };
}

export async function getLeagueDetail(identifier: string, userId: string): Promise<LeagueDetailData | null> {
  const league = await prisma.league.findFirst({
    where: {
      id: { not: 'global' },
      OR: [{ slug: identifier }, { id: identifier }],
    },
    include: {
      owner: { select: { name: true, image: true } },
      members: {
        where: activeMembership,
        orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }],
        select: {
          userId: true,
          role: true,
          points: true,
          pendingPoints: true,
          exactScoreStreak: true,
          bestExactScoreStreak: true,
          joinedAt: true,
          user: { select: { name: true, image: true } },
        },
      },
      rankingCycles: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          key: true,
          status: true,
          stage: true,
          publishedAt: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          pointEntries: { where: { status: 'pending' } },
        },
      },
    },
  });

  if (!league) return null;

  const members = league.members.map(serializeMember);
  const membership = members.find((member) => member.id === userId) ?? null;
  if (league.visibility !== 'public' && !membership) return null;

  const card = serializeCard(league, userId);
  const canManage = membership?.role === 'owner' || membership?.role === 'subadmin';
  const visibleMembers = membership ? members : members.slice(0, 5);

  return {
    ...card,
    inviteCode: membership ? league.inviteCode : null,
    expiresAt: league.expiresAt.toISOString(),
    windowHours: league.windowHours,
    maxEdits: league.maxEdits,
    scoringStartMatchday: league.scoringStartMatchday,
    groupPublicationMode: league.groupPublicationMode,
    knockoutPublicationMode: league.knockoutPublicationMode,
    rulesLockedAt: league.rulesLockedAt?.toISOString() ?? null,
    members: visibleMembers,
    cycles: league.rankingCycles.map((cycle) => ({
      ...cycle,
      publishedAt: cycle.publishedAt?.toISOString() ?? null,
      createdAt: cycle.createdAt.toISOString(),
    })),
    pendingEntryCount: league._count.pointEntries,
    currentUserId: userId,
    canManage,
    isMember: Boolean(membership),
  };
}
