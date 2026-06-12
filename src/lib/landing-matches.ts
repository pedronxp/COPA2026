import 'server-only';

import { prisma } from '@/lib/prisma';
import { selectFeaturedMatches } from '@/lib/landing-match-domain';
import { translateTeamName } from '@/lib/team-translation';

export interface FeaturedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickOff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  elapsed: string | null;
  predictionCount: number;
}

export async function getFeaturedMatches(now = new Date()): Promise<FeaturedMatch[]> {
  const end = new Date(now.getTime() + 24 * 60 * 60_000);
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { status: 'live' },
        {
          status: 'scheduled',
          kickOff: { gte: now, lte: end },
        },
      ],
    },
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  });

  return selectFeaturedMatches(matches, now).map((match) => ({
    id: match.id,
    homeTeam: translateTeamName(match.homeTeam),
    awayTeam: translateTeamName(match.awayTeam),
    kickOff: match.kickOff.toISOString(),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    elapsed: match.elapsed,
    predictionCount: match._count.predictions,
  }));
}
