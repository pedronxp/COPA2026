'use client';

import { useMemo, useState } from 'react';
import type { CalendarData } from '@/lib/player-routes-data';
import type { MatchData } from '@/lib/matches-service';
import {
  formatDateTimePtBr,
  formatLongDatePtBr,
  formatStagePtBr,
  formatTimePtBr,
} from '@/lib/pt-br-format';
import { TeamMark } from './team-mark';

const groups = 'ABCDEFGHIJKL'.split('');

interface CalendarViewProps {
  data: CalendarData;
}

function statusLabel(match: MatchData) {
  if (match.status === 'finished') return `${match.homeScore} x ${match.awayScore}`;
  if (match.status === 'live') return `Ao vivo ${match.homeScore ?? 0} x ${match.awayScore ?? 0}`;
  return formatTimePtBr(match.kickOff);
}

export function CalendarView({ data }: CalendarViewProps) {
  const [selectedGroup, setSelectedGroup] = useState('A');
  const activeLeague = data.leagueContext.activeLeague;
  const predictedMatchIds = useMemo(
    () => new Set(data.predictions.map((prediction) => prediction.matchId)),
    [data.predictions],
  );
  const groupMatches = data.matches.filter(
    (match) => match.stage === 'group' && match.group === selectedGroup,
  );
  const knockoutMatches = data.matches.filter((match) => match.stage !== 'group');

  return (
    <div className="player-page-stack">
      <section className="player-panel player-page-header-panel">
        <div>
          <span className="player-kicker">Calendario oficial</span>
          <h2>Tabela e jogos da Copa</h2>
          <p>
            A tabela e o calendario sao oficiais da competicao. O contexto do {activeLeague.name}
            aparece apenas para destacar partidas em que voce ja palpitou.
          </p>
        </div>
      </section>

      <div className="player-filter-bar" aria-label="Grupos">
        {groups.map((group) => (
          <button
            key={group}
            type="button"
            className={selectedGroup === group ? 'active' : ''}
            onClick={() => setSelectedGroup(group)}
          >
            Grupo {group}
          </button>
        ))}
      </div>

      <section className="player-calendar-grid">
        <div className="player-panel">
          <div className="player-panel-heading">
            <div>
              <span className="player-kicker">Classificacao</span>
              <h3>Grupo {selectedGroup}</h3>
            </div>
          </div>
          <div className="player-standings-table">
            <div className="head">
              <span>#</span>
              <span>Selecao</span>
              <span>P</span>
              <span>J</span>
              <span>V</span>
              <span>E</span>
              <span>D</span>
              <span>SG</span>
            </div>
            {(data.standings[selectedGroup] || []).map((team, index) => (
              <div key={team.name} className={index < 2 ? 'qualified' : ''}>
                <span>{index + 1}</span>
                <span>
                  <TeamMark name={team.name} logo={team.logo} flag={team.flag} align="start" />
                </span>
                <strong>{team.points}</strong>
                <span>{team.played}</span>
                <span>{team.wins}</span>
                <span>{team.draws}</span>
                <span>{team.losses}</span>
                <span>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</span>
              </div>
            ))}
          </div>
          <p className="player-table-note">Os dois primeiros avancam para a fase de 32 avos.</p>
        </div>

        <div className="player-panel">
          <div className="player-panel-heading">
            <div>
              <span className="player-kicker">Jogos</span>
              <h3>Confrontos do Grupo {selectedGroup}</h3>
            </div>
          </div>
          <div className="player-calendar-list">
            {groupMatches.map((match) => (
              <article key={match.id} className={predictedMatchIds.has(match.id) ? 'predicted' : ''}>
                <time>{formatLongDatePtBr(match.kickOff)}</time>
                <div>
                  <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} flag={match.homeFlag} align="end" />
                  <strong>{statusLabel(match)}</strong>
                  <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
                </div>
                {predictedMatchIds.has(match.id) && <span>Voce ja palpitou neste bolao</span>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {knockoutMatches.length > 0 && (
        <section className="player-panel">
          <div className="player-panel-heading">
            <div>
              <span className="player-kicker">Mata-mata</span>
              <h3>Proximas fases</h3>
            </div>
          </div>
          <div className="player-knockout-list">
            {knockoutMatches.map((match) => (
              <article key={match.id} className={predictedMatchIds.has(match.id) ? 'predicted' : ''}>
                <div className="player-knockout-header">
                  <span>{formatStagePtBr(match.stage)}</span>
                  <small>{formatDateTimePtBr(match.kickOff)}</small>
                </div>
                <div className="player-knockout-versus">
                  <TeamMark
                    name={match.homeTeam}
                    logo={match.homeTeamLogo}
                    flag={match.homeFlag}
                    align="end"
                  />
                  <strong className="versus-badge">vs</strong>
                  <TeamMark
                    name={match.awayTeam}
                    logo={match.awayTeamLogo}
                    flag={match.awayFlag}
                    align="start"
                  />
                </div>
                {predictedMatchIds.has(match.id) && (
                  <span className="player-knockout-predicted">Você já palpitou</span>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
