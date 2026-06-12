import 'server-only';

import { prisma, withRetry } from '@/lib/prisma';
import {
  type ActiveLeagueContext,
  getActiveLeagueContext,
} from '@/lib/active-league';
import {
  calculatePredictionPoints,
  getMatchStatsBatch,
  getMatches,
  getPredictions,
  type MatchData,
  type MatchStats,
  type PredictionData,
} from '@/lib/matches-service';

export interface PlayerMemberRow {
  id: string;
  name: string;
  image: string | null;
  points: number;
  pendingPoints: number;
  rank: number;
  streak: number;
  misses: number;
  role: string;
}

export interface TeamStandingRow {
  name: string;
  logo: string | null;
  flag: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface PlayerRouteData {
  leagueContext: ActiveLeagueContext;
  generatedAt: number;
  matches: MatchData[];
  predictions: PredictionData[];
  members: PlayerMemberRow[];
  stats: Record<string, MatchStats>;
}

export interface DashboardData extends PlayerRouteData {
  nextMatch: MatchData | null;
  upcomingPredictions: Array<{ prediction: PredictionData; match: MatchData }>;
  recentResults: Array<{
    prediction: PredictionData | null;
    match: MatchData;
    points: number | null;
  }>;
}

export interface CalendarData extends PlayerRouteData {
  standings: Record<string, TeamStandingRow[]>;
}

export interface LeaderboardData extends PlayerRouteData {
  currentMember: PlayerMemberRow | null;
  podium: PlayerMemberRow[];
  globalMembers: PlayerMemberRow[];
  currentGlobalMember: PlayerMemberRow | null;
  globalPodium: PlayerMemberRow[];
}

export type ResultsData = PlayerRouteData;
export type HistoryData = PlayerRouteData;

function rankMembers<T extends { id: string; points: number }>(members: T[]) {
  let previousPoints: number | null = null;
  let sharedRank = 0;
  return members.map((member, index) => {
    if (member.points !== previousPoints) {
      sharedRank = index + 1;
      previousPoints = member.points;
    }
    return { ...member, rank: sharedRank };
  });
}

async function getMembersForLeague(leagueId: string): Promise<PlayerMemberRow[]> {
  if (leagueId === 'global') {
    const users = await withRetry(() => prisma.user.findMany({
      where: { NOT: { id: 'system' } },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        streak: true,
        misses: true,
      },
    }));
    return rankMembers(
      users.map((user) => ({
        id: user.id,
        name: user.name || 'Usuario',
        image: user.image,
        points: user.points,
        pendingPoints: 0,
        streak: user.streak,
        misses: user.misses,
        role: 'member',
      })),
    );
  }

  const members = await withRetry(() => prisma.leagueMember.findMany({
    where: { leagueId, status: 'active' },
    orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
    select: {
      userId: true,
      role: true,
      points: true,
      pendingPoints: true,
      user: {
        select: {
          name: true,
          image: true,
          streak: true,
          misses: true,
        },
      },
    },
  }));

  return rankMembers(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name || 'Usuario',
      image: member.user.image,
      points: member.points,
      pendingPoints: member.pendingPoints,
      streak: member.user.streak,
      misses: member.user.misses,
      role: member.role,
    })),
  );
}

async function getBasePlayerRouteData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<PlayerRouteData> {
  const leagueContext = await getActiveLeagueContext(userId, requestedLeague);
  const leagueId = leagueContext.activeLeague.id;
  const [matches, predictions, members] = await Promise.all([
    getMatches(),
    getPredictions(userId, leagueId),
    getMembersForLeague(leagueId),
  ]);
  const activeMatchIds = matches
    .filter((match) => match.status !== 'finished')
    .map((match) => match.id);
  const stats = await getMatchStatsBatch(activeMatchIds, leagueId);

  return { leagueContext, generatedAt: Date.now(), matches, predictions, members, stats };
}

export async function getDashboardData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<DashboardData> {
  const base = await getBasePlayerRouteData(userId, requestedLeague);
  const scheduledMatches = base.matches.filter((match) => match.status === 'scheduled');
  const nextMatch =
    scheduledMatches.find(
      (match) => !base.predictions.some((prediction) => prediction.matchId === match.id),
    ) ||
    scheduledMatches[0] ||
    null;

  const upcomingPredictions = base.predictions
    .map((prediction) => ({
      prediction,
      match: base.matches.find((match) => match.id === prediction.matchId),
    }))
    .filter((item): item is { prediction: PredictionData; match: MatchData } =>
      Boolean(item.match && item.match.status !== 'finished'),
    )
    .sort((a, b) => new Date(a.match.kickOff).getTime() - new Date(b.match.kickOff).getTime())
    .slice(0, 4);

  const recentResults = base.matches
    .filter(
      (match) =>
        match.status === 'finished' &&
        match.homeScore !== null &&
        match.awayScore !== null,
    )
    .sort((a, b) => new Date(b.kickOff).getTime() - new Date(a.kickOff).getTime())
    .slice(0, 4)
    .map((match) => {
      const prediction =
        base.predictions.find((item) => item.matchId === match.id) || null;

      return {
        prediction,
        match,
        points:
          prediction && match.homeScore !== null && match.awayScore !== null
            ? calculatePredictionPoints(
                prediction.homeGuess,
                prediction.awayGuess,
                match.homeScore,
                match.awayScore,
                base.leagueContext.activeLeague,
              )
            : null,
      };
    });

  return { ...base, nextMatch, upcomingPredictions, recentResults };
}

export async function getMatchesPageData(
  userId: string,
  requestedLeague?: string | string[] | null,
) {
  return getBasePlayerRouteData(userId, requestedLeague);
}

export async function getResultsData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<ResultsData> {
  return getBasePlayerRouteData(userId, requestedLeague);
}

export async function getHistoryData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<HistoryData> {
  return getBasePlayerRouteData(userId, requestedLeague);
}

function createStanding(name: string, logo: string | null, flag: string | null): TeamStandingRow {
  return {
    name,
    logo,
    flag,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  };
}

function buildGroupStandings(matches: MatchData[]) {
  const groups: Record<string, Record<string, TeamStandingRow>> = {};

  for (const match of matches) {
    if (match.stage !== 'group' || !match.group) continue;
    groups[match.group] ||= {};
    groups[match.group][match.homeTeam] ||= createStanding(
      match.homeTeam,
      match.homeTeamLogo,
      match.homeFlag,
    );
    groups[match.group][match.awayTeam] ||= createStanding(
      match.awayTeam,
      match.awayTeamLogo,
      match.awayFlag,
    );

    if (
      match.status !== 'finished' ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      continue;
    }

    const home = groups[match.group][match.homeTeam];
    const away = groups[match.group][match.awayTeam];
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([group, teams]) => [
      group,
      Object.values(teams).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.name.localeCompare(b.name, 'pt-BR');
      }),
    ]),
  );
}

export async function getCalendarData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<CalendarData> {
  const base = await getBasePlayerRouteData(userId, requestedLeague);
  return {
    ...base,
    standings: buildGroupStandings(base.matches),
  };
}

export async function getLeaderboardData(
  userId: string,
  requestedLeague?: string | string[] | null,
): Promise<LeaderboardData> {
  const base = await getBasePlayerRouteData(userId, requestedLeague);
  const globalMembers =
    base.leagueContext.activeLeague.id === 'global'
      ? base.members
      : await getMembersForLeague('global');

  return {
    ...base,
    currentMember: base.members.find((member) => member.id === userId) || null,
    podium: base.members.slice(0, 3),
    globalMembers,
    currentGlobalMember: globalMembers.find((member) => member.id === userId) || null,
    globalPodium: globalMembers.slice(0, 3),
  };
}
