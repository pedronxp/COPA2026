import { PlayerAppShell } from '@/components/player/app-shell';
import { CalendarView } from '@/components/player/calendar-view';
import { getCalendarData } from '@/lib/player-routes-data';
import { requireUser } from '@/lib/session';

export default async function CalendarPage({
  searchParams,
}: PageProps<'/calendar'>) {
  const params = await searchParams;
  const user = await requireUser('/calendar');
  const data = await getCalendarData(user.id, params.league);

  return (
    <PlayerAppShell
      activeRoute="calendar"
      user={user}
      leagueContext={data.leagueContext}
    >
      <CalendarView data={data} />
    </PlayerAppShell>
  );
}
