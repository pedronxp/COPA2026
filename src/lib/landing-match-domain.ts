export interface LandingMatchCandidate {
  id: string;
  kickOff: Date;
  status: string;
}

export function selectFeaturedMatches<T extends LandingMatchCandidate>(
  matches: T[],
  now = new Date(),
  windowHours = 24,
): T[] {
  const end = now.getTime() + windowHours * 60 * 60_000;

  return matches
    .filter((match) => {
      if (match.status === 'live') return true;
      const kickOff = match.kickOff.getTime();
      return match.status === 'scheduled' && kickOff >= now.getTime() && kickOff <= end;
    })
    .sort((left, right) => {
      if (left.status === 'live' && right.status !== 'live') return -1;
      if (right.status === 'live' && left.status !== 'live') return 1;
      return left.kickOff.getTime() - right.kickOff.getTime();
    });
}

export function formatFeaturedMatchTime(
  kickOffValue: string | Date,
  status: string,
  elapsed: string | null,
  nowValue = new Date(),
) {
  if (status === 'live') {
    if (elapsed === 'halftime') return 'Ao vivo - intervalo';
    if (elapsed && /^\d+$/.test(elapsed)) return `Ao vivo - ${elapsed}'`;
    return 'Ao vivo';
  }

  const kickOff = new Date(kickOffValue);
  const diffMs = kickOff.getTime() - nowValue.getTime();
  if (diffMs <= 0) return 'Começando';

  const diffMinutes = Math.max(1, Math.ceil(diffMs / 60_000));
  if (diffMinutes < 60) return `em ${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes === 0 ? `em ${hours}h` : `em ${hours}h ${minutes}min`;
}
