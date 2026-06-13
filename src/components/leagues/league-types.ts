export type LeagueRole = 'owner' | 'subadmin' | 'member';
export type OwnerEditLockReason = 'used' | 'rules_locked';

export interface LeagueOwnerEditData {
  available: boolean;
  usedAt: string | null;
  usedById: string | null;
  rulesLocked: boolean;
  lockReason: OwnerEditLockReason | null;
  lockMessage: string | null;
}

export interface LeagueRankingEntry {
  id: string;
  name: string;
  image: string | null;
  role: LeagueRole;
  points: number;
  pendingPoints: number;
  exactScoreStreak: number;
  bestExactScoreStreak: number;
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
  visualTheme: string;
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
  pointsBothScoreYes: number;
  pointsBothScoreNo: number;
  lastPublishedAt: string | null;
  editedByOwner: boolean;
  ownerEdit: LeagueOwnerEditData;
  ownerEditUsedAt: string | null;
  ownerEditUsedById: string | null;
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
