'use client';

/* eslint-disable @next/next/no-img-element */
import { getFlagIsoCode } from '@/lib/emoji-flags';
import { translateTeamName } from '@/lib/team-translation';

interface TeamMarkProps {
  name: string;
  logo: string | null;
  flag: string | null;
  align?: 'start' | 'center' | 'end';
}

function initials(name: string) {
  const clean = name.trim();
  if (!clean || clean.toUpperCase() === 'TBD') return 'TBD';
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function TeamMark({ name, logo, flag, align = 'center' }: TeamMarkProps) {
  const translatedName = translateTeamName(name);

  // Determinar qual é o link da bandeira
  let flagUrl = logo;
  if (!flagUrl && flag) {
    const isoCode = getFlagIsoCode(flag) || flag;
    const isIso = isoCode.length === 2 && /^[a-zA-Z]{2}$/.test(isoCode);
    if (isIso) {
      flagUrl = `https://flagcdn.com/w80/${isoCode.toLowerCase()}.png`;
    }
  }

  return (
    <div className={`player-team-mark align-${align} notranslate`} translate="no">
      <span className="player-team-badge">
        {flagUrl ? (
          <img 
            src={flagUrl} 
            alt={translatedName} 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : flag && flag.length <= 4 ? (
          flag
        ) : (
          initials(translatedName)
        )}
      </span>
      <span className="player-team-name">{translatedName}</span>
    </div>
  );
}
