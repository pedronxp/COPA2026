import BolaoApp from '@/components/bolao-app';
import { requireUser } from '@/lib/session';

export default async function HistoryPage() {
  const user = await requireUser('/history');
  return <BolaoApp initialSection="history" authenticatedUser={user} />;
}
