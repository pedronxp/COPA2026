import { PlayerAppShell } from '@/components/player/app-shell';
import { ProfileView } from '@/components/player/profile-view';
import { getActiveLeagueContext } from '@/lib/active-league';
import { getProfileData } from '@/lib/profile-service';
import { requireUser } from '@/lib/session';

export default async function ProfilePage() {
  const user = await requireUser('/profile');
  const [leagueContext, profile] = await Promise.all([
    getActiveLeagueContext(user.id),
    getProfileData(user.id),
  ]);

  return (
    <PlayerAppShell activeRoute="profile" user={user} leagueContext={leagueContext}>
      <ProfileView initialData={profile} />
    </PlayerAppShell>
  );
}
