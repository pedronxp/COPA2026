import type { Metadata } from 'next';
import { LeagueShell } from '@/components/leagues/league-shell';
import { requireUser } from '@/lib/session';
import './leagues.css';

export const metadata: Metadata = {
  title: 'Boloes | Copa dos Crias',
  description: 'Crie, encontre e acompanhe boloes da Copa do Mundo de 2026.',
};

export default async function LeaguesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/leagues');

  return <LeagueShell user={user}>{children}</LeagueShell>;
}
