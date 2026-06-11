import type { Metadata } from 'next';
import { PlayerAppShell } from '@/components/player/app-shell';
import { getActiveLeagueContext } from '@/lib/active-league';
import { requireUser } from '@/lib/session';
import './leagues.css';

export const metadata: Metadata = {
  title: 'Boloes | Copa dos Crias',
  description: 'Crie, encontre e acompanhe boloes da Copa do Mundo de 2026.',
};

export default async function LeaguesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/leagues');
  const leagueContext = await getActiveLeagueContext(user.id);

  return (
    <PlayerAppShell activeRoute="leagues" user={user} leagueContext={leagueContext}>
      {children}
    </PlayerAppShell>
  );
}
