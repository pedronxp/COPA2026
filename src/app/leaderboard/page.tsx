import { PlayerAppShell } from '@/components/player/app-shell';
import { LeaderboardView } from '@/components/player/leaderboard-view';
import { getLeaderboardData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function LeaderboardPage({
  searchParams,
}: PageProps<'/leaderboard'>) {
  const params = await searchParams;
  const user = await requireUser('/leaderboard');
  const data = await getLeaderboardData(user.id, params.league);

  return (
    <PlayerAppShell
      activeRoute="leaderboard"
      user={user}
      leagueContext={data.leagueContext}
    >
      <LeaderboardView data={data} />
    </PlayerAppShell>
  );
}
