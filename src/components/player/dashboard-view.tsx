'use client';

import { useState, useEffect } from 'react';
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
import { getMatchWindowState } from './matches-view-model';

interface DashboardViewProps {
  user: SessionUser;
  data: DashboardData;
}

export function DashboardView({ user, data }: DashboardViewProps) {
  const {
    leagueContext,
    members,
    predictions,
    matches,
    recentResults,
    upcomingPredictions,
  } = data;
  const { activeLeague, options } = leagueContext;
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const leader = members[0] || null;
  const finishedCount = matches.filter((match) => match.status === 'finished').length;
  const scheduledCount = matches.filter((match) => match.status === 'scheduled').length;
  const liveCount = matches.filter((match) => match.status === 'live').length;
  const liveMatches = matches.filter((match) => match.status === 'live');
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
  const rankingHref = activeLeague.slug === 'global' ? '/leaderboard' : `/leaderboard?league=${activeLeague.slug}`;
  const userRankSummary = activeLeague.userRank ? `${userRankLabel} lugar` : 'sem posição';

  // Lógica do carrossel para os próximos jogos (apenas confrontos definidos e mercado aberto)
  const carouselMatches = matches
    .filter((match) => {
      // 1. Confronto definido (se for eliminatória e tiver labels provisórios, verifica se os times foram preenchidos)
      const isHomeTBD = match.homeLabel && (!match.homeTeam || match.homeTeam === match.homeLabel);
      const isAwayTBD = match.awayLabel && (!match.awayTeam || match.awayTeam === match.awayLabel);
      if (match.stage !== 'group' && (isHomeTBD || isAwayTBD)) {
        return false;
      }

      // 2. Mercado de palpites aberto
      const pred = predictions.find((p) => p.matchId === match.id) ?? null;
      const windowState = getMatchWindowState(match, activeLeague, pred, nowMs);
      return windowState.windowStatus === 'open';
    })
    .sort((a, b) => new Date(a.kickOff).getTime() - new Date(b.kickOff).getTime());

  // Rotação automática a cada 5 segundos
  useEffect(() => {
    if (carouselMatches.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % carouselMatches.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselMatches.length]);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMatchIndex((prev) => (prev - 1 + carouselMatches.length) % carouselMatches.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMatchIndex((prev) => (prev + 1) % carouselMatches.length);
  };

  const currentMatch = carouselMatches[currentMatchIndex] || null;

  return (
    <div className="player-dashboard-grid">
      <section className="player-hero-panel player-hero-command">
        <div className="player-hero-copy">
          <span className="player-kicker">Olá, {user.name || 'torcedor'}</span>
          <h2>Central do {activeLeague.name}</h2>
          <div className="player-hero-score" aria-label="Seu desempenho atual">
            <span><strong>{userRankLabel}</strong> posição</span>
            <span><strong>{activeLeague.userPoints}</strong> pontos</span>
            {activeLeague.userPendingPoints > 0 && (
              <span><strong>{activeLeague.userPendingPoints}</strong> pendentes</span>
            )}
          </div>
          {currentMatch ? (
            <p className="player-hero-next">
              O próximo palpite sugerido fecha 30 minutos antes da bola rolar.
            </p>
          ) : (
            <p className="player-hero-next">Nenhuma partida aberta para novos palpites agora.</p>
          )}
          <div className="player-hero-progress" aria-label="Progresso dos palpites">
            <div>
              <span>{scheduledPredictionCount} salvos</span>
              <strong>{predictionCoverage}%</strong>
            </div>
            <div className="player-progress-track" aria-hidden="true">
              <span style={{ width: `${predictionCoverage}%` }} />
            </div>
          </div>
          <div className="player-hero-actions">
            <Link href={matchHref} className="btn btn-neon-green">
              <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
              Palpitar agora
            </Link>
            <Link href={rankingHref} className="btn btn-neon-outline">
              <i className="bi bi-trophy" aria-hidden="true" />
              Ver ranking
            </Link>
            <Link href={calendarHref} className="btn btn-neon-outline">
              <i className="bi bi-calendar-event" aria-hidden="true" />
              Ver tabela
            </Link>
          </div>
        </div>

        <div className="player-hero-focus">
          {currentMatch ? (
            (() => {
              const userPred = predictions.find((p) => p.matchId === currentMatch.id);
              const timeLeft = new Date(currentMatch.kickOff).getTime() - 30 * 60_000 - nowMs;
              const isExpiringSoon = timeLeft > 0 && timeLeft < 2 * 3600 * 1000;

              return (
                <div className="player-hero-match-card">
                  <div className="player-hero-match-head d-flex justify-content-between align-items-center w-100">
                    <button 
                      onClick={handlePrev} 
                      className="btn btn-link p-0 text-secondary border-0 d-flex align-items-center" 
                      style={{ cursor: 'pointer', outline: 'none', textDecoration: 'none' }}
                      disabled={carouselMatches.length <= 1}
                    >
                      <i className="bi bi-chevron-left fs-6" />
                    </button>
                    <div className="text-center d-flex flex-column align-items-center">
                      <span className="text-secondary" style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '800' }}>
                        Próximo jogo ({currentMatchIndex + 1}/{carouselMatches.length})
                      </span>
                      <strong className="text-white mt-0.5" style={{ fontSize: '0.8rem' }}>{formatDateTimePtBr(currentMatch.kickOff)}</strong>
                    </div>
                    <button 
                      onClick={handleNext} 
                      className="btn btn-link p-0 text-secondary border-0 d-flex align-items-center" 
                      style={{ cursor: 'pointer', outline: 'none', textDecoration: 'none' }}
                      disabled={carouselMatches.length <= 1}
                    >
                      <i className="bi bi-chevron-right fs-6" />
                    </button>
                  </div>
                  <div className="player-hero-match-teams">
                    <TeamMark
                      name={currentMatch.homeTeam}
                      logo={currentMatch.homeTeamLogo}
                      flag={currentMatch.homeFlag}
                      align="center"
                    />
                    {userPred ? (
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="d-flex align-items-center gap-2 justify-content-center notranslate" translate="no">
                          <strong className="fs-4 text-success mb-0">{userPred.homeGuess}</strong>
                          <span className="text-secondary fw-semibold">x</span>
                          <strong className="fs-4 text-success mb-0">{userPred.awayGuess}</strong>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 mt-1" style={{ fontSize: '0.62rem', textTransform: 'uppercase' }}>
                          ✓ Salvo
                        </span>
                      </div>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="d-flex align-items-center gap-2 justify-content-center opacity-60 notranslate" translate="no">
                          <strong className="fs-4 text-secondary mb-0">0</strong>
                          <span className="text-secondary fw-semibold">x</span>
                          <strong className="fs-4 text-secondary mb-0">0</strong>
                        </div>
                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-20 mt-1" style={{ fontSize: '0.62rem', textTransform: 'uppercase' }}>
                          ⚠️ Pendente
                        </span>
                      </div>
                    )}
                    <TeamMark
                      name={currentMatch.awayTeam}
                      logo={currentMatch.awayTeamLogo}
                      flag={currentMatch.awayFlag}
                      align="center"
                    />
                  </div>
                  <span className="urgency-badge" style={isExpiringSoon ? { color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.22)' } : {}}>
                    <i className={isExpiringSoon ? "bi bi-exclamation-triangle-fill" : "bi bi-clock-fill"} aria-hidden="true" />{' '}
                    {isExpiringSoon ? 'Expira em breve: ' : 'Expira em '}
                    {formatRelativeWindowPtBr(new Date(new Date(currentMatch.kickOff).getTime() - 30 * 60_000))}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="player-hero-match-card empty">
              <i className="bi bi-calendar-check" aria-hidden="true" />
              <strong>Rodada em espera</strong>
              <span>Assim que uma janela abrir, ela aparece aqui.</span>
            </div>
          )}

          <div className="player-hero-league-card">
            <ActiveLeagueSwitcher options={options} activeLeagueId={activeLeague.id} compact />
            <div className="player-hero-league-meta">
              <span>{activeLeague.memberCount} competidores</span>
              <span>{formatLeagueStatusPtBr(activeLeague.status)}</span>
              <span>{activeLeague.windowHours}h de janela</span>
            </div>
          </div>
        </div>
      </section>

      <details className="player-summary-dropdown" open>
        <summary>
          <div>
            <span className="player-kicker">Resumo do bolão</span>
            <strong>{userRankSummary} - {activeLeague.userPoints} pontos - {predictionCoverage}% dos palpites</strong>
          </div>
          <i className="bi bi-chevron-down" aria-hidden="true" />
        </summary>

        <section className="player-stat-grid" aria-label="Resumo do bolão ativo">
          <div className="player-stat-card">
            <span>Classificação</span>
            <strong>{userRankLabel}</strong>
            <small>{activeLeague.memberCount} competidores no bolão</small>
          </div>
          <div className="player-stat-card">
            <span>Pontuação</span>
            <strong>{activeLeague.userPoints}</strong>
            <small>{activeLeague.userPendingPoints > 0 ? `${activeLeague.userPendingPoints} pontos pendentes` : 'pontos publicados'}</small>
          </div>
          <div className="player-stat-card">
            <span>Palpites</span>
            <strong>{predictionCount}</strong>
            <small>{predictionCoverage}% concluído</small>
          </div>
          <div className="player-stat-card">
            <span>Situação</span>
            <strong>{formatLeagueStatusPtBr(activeLeague.status)}</strong>
            <small>Janela de palpites: {activeLeague.windowHours}h</small>
          </div>
        </section>
      </details>

      <section className="player-dashboard-command">
        <div className="player-progress-card">
          <div className="player-panel-heading">
            <div>
              <span className="player-kicker">Progresso</span>
              <h3>Palpites da rodada</h3>
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
          <Link href={calendarHref}>
            <i className="bi bi-table" aria-hidden="true" />
            <span>Tabela</span>
          </Link>
        </div>
      </section>

      <section className="player-panel player-next-panel">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Ação recomendada</span>
            <h3>Próximo palpite</h3>
          </div>
          <Link href={matchHref} className="btn btn-neon-green">
            Palpitar
          </Link>
        </div>

        {currentMatch ? (
          (() => {
            const userPred = predictions.find((p) => p.matchId === currentMatch.id);
            const timeLeft = new Date(currentMatch.kickOff).getTime() - 30 * 60_000 - nowMs;
            const isExpiringSoon = timeLeft > 0 && timeLeft < 2 * 3600 * 1000;

            return (
              <div className="player-next-match">
                <TeamMark
                  name={currentMatch.homeTeam}
                  logo={currentMatch.homeTeamLogo}
                  flag={currentMatch.homeFlag}
                  align="end"
                />
                <div className="player-versus">
                  {userPred ? (
                    <div className="d-flex flex-column align-items-center">
                      <div className="d-flex align-items-center gap-2 justify-content-center notranslate" translate="no">
                        <strong className="text-success fs-4 mb-0">{userPred.homeGuess}</strong>
                        <span className="text-secondary fw-semibold">x</span>
                        <strong className="text-success fs-4 mb-0">{userPred.awayGuess}</strong>
                      </div>
                      <small className="text-success mt-1" style={{ fontSize: '0.7rem', fontWeight: '800' }}>✓ PALPITE SALVO</small>
                    </div>
                  ) : (
                    <div className="d-flex flex-column align-items-center">
                      <div className="d-flex align-items-center gap-2 justify-content-center opacity-60 notranslate" translate="no">
                        <strong className="text-secondary fs-4 mb-0">0</strong>
                        <span className="text-secondary fw-semibold">x</span>
                        <strong className="text-secondary fs-4 mb-0">0</strong>
                      </div>
                      <small className="text-danger mt-1" style={{ fontSize: '0.7rem', fontWeight: '800' }}>⚠️ PENDENTE</small>
                    </div>
                  )}
                  <span className="mt-2 text-secondary" style={{ fontSize: '0.75rem' }}>
                    {formatDateTimePtBr(currentMatch.kickOff)}
                  </span>
                  <span className="urgency-badge" style={isExpiringSoon ? { color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.22)' } : {}}>
                    <i className={isExpiringSoon ? "bi bi-exclamation-triangle-fill" : "bi bi-clock-fill"} aria-hidden="true" />{' '}
                    {isExpiringSoon ? 'Expira em breve: ' : 'Expira em '}
                    {formatRelativeWindowPtBr(new Date(new Date(currentMatch.kickOff).getTime() - 30 * 60_000))}
                  </span>
                </div>
                <TeamMark
                  name={currentMatch.awayTeam}
                  logo={currentMatch.awayTeamLogo}
                  flag={currentMatch.awayFlag}
                  align="start"
                />
              </div>
            );
          })()
        ) : (
          <p className="player-empty-text">Não há partidas abertas para novos palpites agora.</p>
        )}
      </section>

      <section className="player-panel player-dashboard-side">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Topo do bolão</span>
            <h3>Liderança</h3>
          </div>
          <Link href={rankingHref} className="leaderboard-updated">Ver tudo</Link>
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
            <span className="player-kicker">Tempo real</span>
            <h3 className="d-flex align-items-center gap-2">
              <span className="live-pulse" /> Partidas em andamento
            </h3>
          </div>
          {liveMatches.length > 0 && (
            <span className="badge bg-danger animate__animated animate__pulse animate__infinite" style={{ fontSize: '0.7rem' }}>
              Ao vivo
            </span>
          )}
        </div>
        {liveMatches.length > 0 ? (
          <div className="player-compact-list flex-list">
            {liveMatches.map((match) => {
              const userPred = predictions.find((p) => p.matchId === match.id);
              return (
                <div key={match.id} className="player-compact-result-row live-match-row">
                  <div className="result-main-info">
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 d-flex align-items-center gap-1.5" style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}>
                      <span className="live-pulse" />
                      {match.elapsed && match.elapsed !== 'live' ? match.elapsed : 'Ao vivo'}
                    </span>
                    <div className="teams-result">
                      <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} flag={match.homeFlag} align="end" />
                      <span className="score-pill border-danger text-danger bg-danger bg-opacity-5 notranslate" translate="no" style={{ fontWeight: 800 }}>
                        {match.homeScore} x {match.awayScore}
                      </span>
                      <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
                    </div>
                  </div>
                  {userPred ? (
                    <small className="guess-label text-success">
                      Seu palpite: {userPred.homeGuess} x {userPred.awayGuess}
                    </small>
                  ) : (
                    <small className="guess-label text-warning">
                      Você não palpitou nesta partida
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="player-empty-text">Nenhuma partida em andamento no momento.</p>
        )}
      </section>

      <section className="player-panel player-dashboard-main">
        <div className="player-panel-heading">
          <div>
            <span className="player-kicker">Agenda pessoal</span>
            <h3>Seus próximos palpites</h3>
          </div>
        </div>
        {upcomingPredictions.length > 0 ? (
          <div className="player-compact-list flex-list">
            {upcomingPredictions.map(({ prediction, match }) => (
              <div key={prediction.id} className="player-compact-prediction-row">
                <small className="date-badge">{formatDateTimePtBr(match.kickOff)}</small>
                <div className="teams-guess">
                  <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} flag={match.homeFlag} align="end" />
                  <span className="guess-pill">{prediction.homeGuess} x {prediction.awayGuess}</span>
                  <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
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
            <span className="player-kicker">Pontuação recente</span>
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
                    <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} flag={match.homeFlag} align="end" />
                    <span className="score-pill notranslate" translate="no">{match.homeScore} x {match.awayScore}</span>
                    <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
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
            <span className="player-kicker">Regras</span>
            <h3>Pontuação</h3>
          </div>
        </div>
        <div className="player-rule-grid">
          <div>
            <span className="rule-icon"><i className="bi bi-bullseye" aria-hidden="true" /></span>
            <span className="rule-label">Exato</span>
            <strong>{activeLeague.pointsExact}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-sliders" aria-hidden="true" /></span>
            <span className="rule-label">Saldo</span>
            <strong>{activeLeague.pointsDiff}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-house-door" aria-hidden="true" /></span>
            <span className="rule-label">Casa</span>
            <strong>{activeLeague.pointsWinnerHome}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-shuffle" aria-hidden="true" /></span>
            <span className="rule-label">Empate</span>
            <strong>{activeLeague.pointsDraw}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-airplane" aria-hidden="true" /></span>
            <span className="rule-label">Fora</span>
            <strong>{activeLeague.pointsWinnerAway}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-check2-circle" aria-hidden="true" /></span>
            <span className="rule-label">Ambas sim</span>
            <strong>{activeLeague.pointsBothScoreYes}</strong>
          </div>
          <div>
            <span className="rule-icon"><i className="bi bi-x-circle" aria-hidden="true" /></span>
            <span className="rule-label">Ambas nao</span>
            <strong>{activeLeague.pointsBothScoreNo}</strong>
          </div>
        </div>
        <div className="player-dashboard-note">
          <i className="bi bi-shield-check" aria-hidden="true" />
          <span>{formatJoinPolicyPtBr(activeLeague.joinPolicy)} - máximo de {activeLeague.maxEdits} edições por jogo</span>
        </div>
      </section>
    </div>
  );
}
