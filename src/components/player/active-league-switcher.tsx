'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ACTIVE_LEAGUE_COOKIE } from '@/lib/active-league-cookie';
import type { ActiveLeagueOption } from '@/lib/active-league';

interface ActiveLeagueSwitcherProps {
  options: ActiveLeagueOption[];
  activeLeagueId: string;
  compact?: boolean;
}

export function ActiveLeagueSwitcher({
  options,
  activeLeagueId,
  compact = false,
}: ActiveLeagueSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeLeague(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const selected = options.find((league) => league.id === value);
    const reference = selected?.slug || value;

    if (reference === 'global') params.delete('league');
    else params.set('league', reference);

    document.cookie = `${ACTIVE_LEAGUE_COOKIE}=${encodeURIComponent(reference)}; path=/; max-age=31536000; SameSite=Lax`;
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  }

  return (
    <label className={`player-league-switcher ${compact ? 'compact' : ''}`}>
      <span>
        <i className="bi bi-trophy-fill" aria-hidden="true" />
        Bolão ativo
      </span>
      <select value={activeLeagueId} onChange={(event) => changeLeague(event.target.value)}>
        {options.map((league) => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>
    </label>
  );
}
