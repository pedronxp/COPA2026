export type LeagueRole = 'owner' | 'subadmin' | 'member';

export interface LeagueRankingEntry {
  id: string;
  name: string;
  image: string | null;
  role: LeagueRole;
  points: number;
  pendingPoints: number;
  joinedAt: string;
}

export interface LeagueCardData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: string;
  joinPolicy: string;
  status: string;
  maxMembers: number;
  memberCount: number;
  ownerName: string;
  ownerImage: string | null;
  userRole: LeagueRole | null;
  userPoints: number | null;
  userRank: number | null;
  leader: LeagueRankingEntry | null;
  rankingPreview: LeagueRankingEntry[];
  scoringPreset: string;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
  lastPublishedAt: string | null;
}

export interface LeagueCycleData {
  id: string;
  key: string;
  status: string;
  stage: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface LeagueDetailData extends LeagueCardData {
  inviteCode: string | null;
  expiresAt: string;
  windowHours: number;
  maxEdits: number;
  scoringStartMatchday: number;
  groupPublicationMode: string;
  knockoutPublicationMode: string;
  rulesLockedAt: string | null;
  members: LeagueRankingEntry[];
  cycles: LeagueCycleData[];
  pendingEntryCount: number;
  currentUserId: string;
  canManage: boolean;
  isMember: boolean;
}
