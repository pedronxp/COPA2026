import { PlayerAppShell } from '@/components/player/app-shell';
import { MatchesBoard } from '@/components/player/matches-board';
import { getMatchesPageData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function MatchesPage({
  searchParams,
}: PageProps<'/matches'>) {
  const params = await searchParams;
  const user = await requireUser('/matches');
  const data = await getMatchesPageData(user.id, params.league);

  return (
    <PlayerAppShell
      activeRoute="matches"
      user={user}
      leagueContext={data.leagueContext}
    >
      <MatchesBoard data={data} />
    </PlayerAppShell>
  );
}
