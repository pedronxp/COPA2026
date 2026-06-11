import { notFound } from 'next/navigation';
import { getLeagueDetail } from '@/components/leagues/league-data';
import { LeagueDetail } from '@/components/leagues/league-detail';
import { requireUser } from '@/lib/session';

export default async function LeagueDetailPage(props: PageProps<'/leagues/[slug]'>) {
  const { slug } = await props.params;
  const user = await requireUser(`/leagues/${slug}`);
  const league = await getLeagueDetail(slug, user.id);

  if (!league) notFound();

  return <LeagueDetail league={league} />;
}
