import BolaoApp from '@/components/bolao-app';
import { requireUser } from '@/lib/session';

export default async function ResultsPage() {
  const user = await requireUser('/results');
  return <BolaoApp initialSection="results" authenticatedUser={user} />;
}
