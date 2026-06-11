/* eslint-disable @next/next/no-img-element */
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

  return (
    <div className={`player-team-mark align-${align}`}>
      <span className="player-team-badge">
        {logo ? (
          <img src={logo} alt="" />
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
