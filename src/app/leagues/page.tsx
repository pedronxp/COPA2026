import { getLeaguesOverview } from '@/components/leagues/league-data';
import { LeaguesOverview } from '@/components/leagues/leagues-overview';
import { requireUser } from '@/lib/session';

export default async function LeaguesPage() {
  const user = await requireUser('/leagues');
  const overview = await getLeaguesOverview(user.id);

  return <LeaguesOverview mine={overview.mine} discover={overview.discover} />;
}
