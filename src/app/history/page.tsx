import { PlayerAppShell } from '@/components/player/app-shell';
import { HistoryView } from '@/components/player/history-view';
import { getHistoryData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function HistoryPage({
  searchParams,
}: PageProps<'/history'>) {
  const params = await searchParams;
  const user = await requireUser('/history');
  const data = await getHistoryData(user.id, params.league);

  return (
    <PlayerAppShell activeRoute="history" user={user} leagueContext={data.leagueContext}>
      <HistoryView data={data} />
    </PlayerAppShell>
  );
}
