import type { Metadata } from 'next';
import { CreateLeagueWizard } from '@/components/leagues/create-league-wizard';

export const metadata: Metadata = {
  title: 'Criar bolão | Copa dos Crias',
};

export default function CreateLeaguePage() {
  return <CreateLeagueWizard />;
}
