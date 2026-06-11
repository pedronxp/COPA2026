import type { Metadata } from 'next';
import { JoinLeagueForm } from '@/components/leagues/join-league-form';

export const metadata: Metadata = {
  title: 'Entrar em um bolão | Copa dos Crias',
};

export default function JoinLeaguePage() {
  return <JoinLeagueForm />;
}
