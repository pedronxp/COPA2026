import { PlayerAppShell } from '@/components/player/app-shell';
import { ResultsView } from '@/components/player/results-view';
import { getResultsData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function ResultsPage({
  searchParams,
}: PageProps<'/results'>) {
  const params = await searchParams;
  const user = await requireUser('/results');
  const data = await getResultsData(user.id, params.league);

  return (
    <PlayerAppShell activeRoute="results" user={user} leagueContext={data.leagueContext}>
      <ResultsView data={data} />
    </PlayerAppShell>
  );
}
