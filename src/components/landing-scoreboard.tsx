'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  formatFeaturedMatchTime,
} from '@/lib/landing-match-domain';
import type { FeaturedMatch } from '@/lib/landing-matches';

interface FeaturedMatchesResponse {
  matches: FeaturedMatch[];
}

export default function LandingScoreboard({
  initialMatches,
}: {
  initialMatches: FeaturedMatch[];
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch('/api/public/featured-matches', {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json() as FeaturedMatchesResponse;
        if (active) setMatches(payload.matches);
      } catch {
        // Keep the last valid database snapshot visible during transient failures.
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      setNow(new Date());
      void refresh();
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const hasLiveMatches = useMemo(
    () => matches.some((match) => match.status === 'live'),
    [matches],
  );

  return (
    <aside className="landing-scoreboard" aria-label="Jogos ao vivo e próximas 24 horas">
      <div className="scoreboard-header">
        <span>{hasLiveMatches ? 'Ao vivo e próximos jogos' : 'Próximos jogos - 24h'}</span>
        <i className="bi bi-broadcast-pin" aria-hidden="true"></i>
      </div>

      {matches.map((match) => {
        const isLive = match.status === 'live';
        const timeLabel = formatFeaturedMatchTime(
          match.kickOff,
          match.status,
          match.elapsed,
          now,
        );

        return (
          <div className="scoreboard-match animate__animated animate__fadeIn" key={match.id}>
            <div>
              <strong className="notranslate" translate="no">{match.homeTeam}</strong>
              <span
                className={`${isLive ? 'text-neon-green animate__animated animate__pulse animate__infinite' : ''} notranslate`}
                translate="no"
              >
                {isLive ? `${match.homeScore ?? 0} x ${match.awayScore ?? 0}` : 'x'}
              </span>
              <strong className="notranslate" translate="no">{match.awayTeam}</strong>
            </div>
            <div>
              <span className={isLive ? 'scoreboard-live-label' : undefined}>
                {isLive && <span className="live-pulse" aria-hidden="true" />}
                {timeLabel}
              </span>
              <small>
                {match.predictionCount.toLocaleString('pt-BR')}{' '}
                {match.predictionCount === 1 ? 'palpite' : 'palpites'}
              </small>
            </div>
          </div>
        );
      })}

      {matches.length === 0 && (
        <div className="scoreboard-empty">
          <i className="bi bi-calendar2-check" aria-hidden="true"></i>
          <span>Nenhum jogo ao vivo ou previsto para as próximas 24 horas.</span>
        </div>
      )}
    </aside>
  );
}
