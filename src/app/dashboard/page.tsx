import { PlayerAppShell } from '@/components/player/app-shell';
import { DashboardView } from '@/components/player/dashboard-view';
import { getDashboardData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  const params = await searchParams;
  const user = await requireUser('/dashboard');
  const data = await getDashboardData(user.id, params.league);

  return (
    <PlayerAppShell
      activeRoute="dashboard"
      user={user}
      leagueContext={data.leagueContext}
    >
      <DashboardView user={user} data={data} />
    </PlayerAppShell>
  );
}
