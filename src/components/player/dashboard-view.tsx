import Link from 'next/link';
import type { SessionUser } from '@/lib/session';
import type { DashboardData } from '@/lib/player-routes-data';
import {
  formatDateTimePtBr,
  formatJoinPolicyPtBr,
  formatLeagueStatusPtBr,
  formatOrdinalPtBr,
  formatRelativeWindowPtBr,
} from '@/lib/pt-br-format';
import { ActiveLeagueSwitcher } from './active-league-switcher';
import { TeamMark } from './team-mark';

interface DashboardViewProps {
  user: SessionUser;
  data: DashboardData;
}

export function DashboardView({ user, data }: DashboardViewProps) {
  const { leagueContext, members, predictions, matches, nextMatch, recentResults, upcomingPredictions } = data;
  const { activeLeague, options } = leagueContext;
  const leader = members[0] || null;
  const finishedCount = matches.filter((match) => match.status === 'finished').length;
  const scheduledCount = matches.filter((match) => match.status === 'scheduled').length;
  const liveCount = matches.filter((match) => match.status === 'live').length;
  const predictionCount = predictions.length;
  const scheduledMatchIds = new Set(
    matches.filter((match) => match.status === 'scheduled').map((match) => match.id),
  );
  const scheduledPredictionCount = predictions.filter((prediction) =>
    scheduledMatchIds.has(prediction.matchId),
  ).length;
  const predictionCoverage = scheduledCount > 0
    ? Math.min(100, Math.round((scheduledPredictionCount / scheduledCount) * 100))
    : 0;
  const userRankLabel = formatOrdinalPtBr(activeLeague.userRank);
  const matchHref = activeLeague.slug === 'global' ? '/matches' : `/matches?league=${activeLeague.slug}`;
  const calendarHref = activeLeague.slug === 'global' ? '/calendar' : `/calendar?league=${activeLeague.slug}`;
  const rankingHref = activeLeague.slug === 'global' ? '/leaderboard' : `/leagues/${activeLeague.slug}`;

  return (
    <div className="player-dashboard-grid">
      <section className="player-hero-panel">
        <div>
          <span className="player-kicker">Olá, {user.name || 'torcedor'}</span>
          <h2>Seu painel no {activeLeague.name}</h2>
          <div className="player-hero-actions">
            <Link href={matchHref} className="btn btn-neon-green">
              <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
              Palpitar
            </Link>
            <Link href={calendarHref} className="btn btn-neon-outline">
              <i className="bi bi-calendar-event" aria-hidden="true" />
              Calendário
            </Link>
          </div>
        </div>
        <ActiveLeagueSwitcher options={options} activeLeagueId={activeLeague.id} compact />
      </section>

      <section className="player-stat-grid" aria-label="Resumo do bolão ativo">
        <div className="player-stat-card">
          <span>Posição</span>
          <strong>{userRankLabel}</strong>
          <small>de {activeLeague.memberCount} competidores</small>
        </div>
        <div className="player-stat-card">
          <span>Pontos</span>
          <strong>{activeLeague.userPoints}</strong>
          <small>{activeLeague.userPendingPoints > 0 ? `${activeLeague.userPendingPoints} pendentes` : ''}</small>
        </div>
        <div className="player-stat-card">
          <span>Palpites</span>
          <strong>{predictionCount}</strong>
          <small>{predictionCoverage}% concluído</small>
        </div>
        <div className="player-stat-card">
          <span>Status</span>
          <strong>{formatLeagueStatusPtBr(activeLeague.status)}</strong>
          <small>Janela de {activeLeague.windowHours}h</small>
        </div>
      </section>

      <section className="player-dashboard-command">
        <div className="player-progress-card">
          <div className="player-panel-heading">
            <div>
              <h3>Progresso dos palpites</h3>
            </div>
            <strong>{predictionCoverage}%</strong>
          </div>
          <div className="player-progress-track" aria-hidden="true">
            <span style={{ width: `${predictionCoverage}%` }} />
          </div>
          <div className="player-progress-meta">
            <span>{scheduledPredictionCount} salvos</span>
            <span>{scheduledCount} jogos</span>
            <span>{finishedCount} finalizados</span>
            {liveCount > 0 && <span>{liveCount} ao vivo</span>}
          </div>
        </div>

        <div className="player-action-grid" aria-label="Atalhos do dashboard">
          <Link href={matchHref}>
            <i className="bi bi-pencil-square" aria-hidden="true" />
            <span>Palpitar</span>
          </Link>
          <Link href={rankingHref}>
            <i className="bi bi-trophy" aria-hidden="true" />
            <span>Ranking</span>
          </Link>
          <Link href="/leagues">
            <i className="bi bi-people" aria-hidden="true" />
            <span>Bolões</span>
          </Link>
        </div>
      </section>

      <section className="player-panel player-next-panel">
        <div className="player-panel-heading">
          <div>
            <h3>Palpite recomendado</h3>
          </div>
          <Link href={matchHref} className="btn btn-neon-green">
            Palpitar
          </Link>
        </div>

        {nextMatch ? (
          <div className="player-next-match">
            <TeamMark
              name={nextMatch.homeTeam}
              logo={nextMatch.homeTeamLogo}
              flag={nextMatch.homeFlag}
              align="end"
            />
            <div className="player-versus">
              <strong>VS</strong>
              <span>{formatDateTimePtBr(nextMatch.kickOff)}</span>
              <span className="urgency-badge">
                <i className="bi bi-clock-fill" aria-hidden="true" /> Expira em {formatRelativeWindowPtBr(new Date(new Date(nextMatch.kickOff).getTime() - 30 * 60_000))}
              </span>
            </div>
            <TeamMark
              name={nextMatch.awayTeam}
              logo={nextMatch.awayTeamLogo}
              flag={nextMatch.awayFlag}
              align="start"
            />
          </div>
        ) : (
          <p className="player-empty-text">Não há partidas abertas para novos palpites agora.</p>
        )}
      </section>

      <section className="player-panel player-dashboard-side">
        <div className="player-panel-heading">
          <div>
            <h3>Liderança do bolão</h3>
          </div>
        </div>
        {leader ? (
          <div className="player-leader-row">
            <span>{leader.image || leader.name.slice(0, 1)}</span>
            <div>
              <strong>{leader.name}</strong>
              <small>{leader.points} pts</small>
            </div>
          </div>
        ) : (
          <p className="player-empty-text">Ainda não há participantes no ranking.</p>
        )}
        <div className="player-mini-ranking">
          {members.slice(0, 5).map((member) => (
            <div key={member.id}>
              <span>#{member.rank}</span>
              <strong>{member.name}</strong>
              <small>{member.points} pts</small>
            </div>
          ))}
        </div>
      </section>

      <section className="player-panel player-dashboard-main">
        <div className="player-panel-heading">
          <div>
            <h3>Seus próximos palpites</h3>
          </div>
        </div>
        {upcomingPredictions.length > 0 ? (
          <div className="player-compact-list flex-list">
            {upcomingPredictions.map(({ prediction, match }) => (
              <div key={prediction.id} className="player-compact-prediction-row">
                <small className="date-badge">{formatDateTimePtBr(match.kickOff)}</small>
                <div className="teams-guess">
                  <TeamMark
                    name={match.homeTeam}
                    logo={match.homeTeamLogo}
                    flag={match.homeFlag}
                    align="end"
                  />
                  <span className="guess-pill">{prediction.homeGuess} x {prediction.awayGuess}</span>
                  <TeamMark
                    name={match.awayTeam}
                    logo={match.awayTeamLogo}
                    flag={match.awayFlag}
                    align="start"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="player-empty-text">Você ainda não tem palpites salvos para jogos futuros.</p>
        )}
      </section>

      <section className="player-panel player-dashboard-main">
        <div className="player-panel-heading">
          <div>
            <h3>Últimos resultados</h3>
          </div>
        </div>
        {recentResults.length > 0 ? (
          <div className="player-compact-list flex-list">
            {recentResults.map(({ prediction, match, points }) => (
              <div key={prediction.id} className="player-compact-result-row">
                <div className="result-main-info">
                  <span className={`points-badge pts-${points}`}>+{points} pts</span>
                  <div className="teams-result">
                    <TeamMark
                      name={match.homeTeam}
                      logo={match.homeTeamLogo}
                      flag={match.homeFlag}
                      align="end"
                    />
                    <span className="score-pill">{match.homeScore} x {match.awayScore}</span>
                    <TeamMark
                      name={match.awayTeam}
                      logo={match.awayTeamLogo}
                      flag={match.awayFlag}
                      align="start"
                    />
                  </div>
                </div>
                <small className="guess-label">Palpite: {prediction.homeGuess} x {prediction.awayGuess}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="player-empty-text">Nenhum resultado processado neste bolão ainda.</p>
        )}
      </section>

      <section className="player-panel player-dashboard-side">
        <div className="player-panel-heading">
          <div>
            <h3>Regras de pontuação</h3>
          </div>
        </div>
        <div className="player-rule-grid">
          <div>
            <span className="rule-icon">🎯</span>
            <span className="rule-label">Exato</span>
            <strong>{activeLeague.pointsExact}</strong>
          </div>
          <div>
            <span className="rule-icon">⚖️</span>
            <span className="rule-label">Saldo</span>
            <strong>{activeLeague.pointsDiff}</strong>
          </div>
          <div>
            <span className="rule-icon">🏆</span>
            <span className="rule-label">Vitória</span>
            <strong>{activeLeague.pointsWinner}</strong>
          </div>
          <div>
            <span className="rule-icon">🤝</span>
            <span className="rule-label">Empate</span>
            <strong>{activeLeague.pointsDraw}</strong>
          </div>
        </div>
        <div className="player-dashboard-note">
          <i className="bi bi-shield-check" aria-hidden="true" />
          <span>{formatJoinPolicyPtBr(activeLeague.joinPolicy)} • Máximo de {activeLeague.maxEdits} edições por jogo</span>
        </div>
      </section>
    </div>
  );
}
