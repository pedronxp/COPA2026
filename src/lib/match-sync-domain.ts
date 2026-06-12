export type MatchSyncStatus = 'scheduled' | 'live' | 'finished';

export interface MatchSyncState {
  status: string;
  elapsed: string | null;
  homeScore: number | null;
  awayScore: number | null;
}

const STATUS_RANK: Record<MatchSyncStatus, number> = {
  scheduled: 0,
  live: 1,
  finished: 2,
};

export function normalizeMatchStatus(
  finished: string | null | undefined,
  elapsed: string | null | undefined,
): MatchSyncStatus {
  if (finished?.toUpperCase() === 'TRUE' || elapsed === 'finished') return 'finished';
  if (elapsed && elapsed !== 'notstarted') return 'live';
  return 'scheduled';
}

export function mergeMatchSyncState(
  existing: MatchSyncState | null,
  incoming: MatchSyncState,
): MatchSyncState {
  if (!existing) return incoming;

  const currentStatus = existing.status as MatchSyncStatus;
  const nextStatus = incoming.status as MatchSyncStatus;
  if (
    currentStatus in STATUS_RANK &&
    nextStatus in STATUS_RANK &&
    STATUS_RANK[nextStatus] < STATUS_RANK[currentStatus]
  ) {
    return existing;
  }

  return {
    ...incoming,
    homeScore: incoming.homeScore ?? existing.homeScore,
    awayScore: incoming.awayScore ?? existing.awayScore,
  };
}
