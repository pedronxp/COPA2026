'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SessionUser } from '@/lib/session';
import type { DashboardData, PlayerMemberRow } from '@/lib/player-routes-data';
import { getFlagIsoCode, isEmoji } from '@/lib/emoji-flags';
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

function getAvatarStyle(name: string) {
  const charCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = charCode % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`,
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };
}

function renderAvatar(member: PlayerMemberRow) {
  const avatarVal = member.image || member.name.slice(0, 1).toUpperCase();
  const flagIso = member.image ? getFlagIsoCode(member.image) : null;
  const emojiOnly = member.image ? isEmoji(member.image) : false;
  const avatarStyle = getAvatarStyle(member.name);

  if (flagIso) {
    return (
      <div className="podium-avatar has-flag" aria-hidden="true">
        <img
          src={`https://flagcdn.com/w80/${flagIso}.png`}
          alt={member.name}
          className="avatar-flag-image"
        />
      </div>
    );
  }

  return (
    <div
      className={`podium-avatar ${emojiOnly ? 'is-emoji' : ''}`}
      style={emojiOnly ? undefined : avatarStyle}
      aria-hidden="true"
    >
      {avatarVal}
    </div>
  );
}

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
  const [displayLeagueIndex, setDisplayLeagueIndex] = useState(0);
  const [rankings, setRankings] = useState<Record<string, PlayerMemberRow[]>>(() => ({
    [activeLeague.id]: members,
  }));

  useEffect(() => {
    const fetchRankings = async () => {
      for (const option of options) {
        if (option.id === activeLeague.id) continue;
        try {
          const res = await fetch(`/api/leagues/${option.slug}/ranking`);
          if (res.ok) {
            const json = await res.json();
            if (json.ranking) {
              setRankings((prev) => ({
                ...prev,
                [option.id]: json.ranking,
              }));
            }
          }
        } catch (err) {
          console.error('Erro ao buscar ranking para o grupo', option.name, err);
        }
      }
    };
    fetchRankings();
  }, [options, activeLeague.id]);

  useEffect(() => {
    if (options.length <= 1) return;
    const interval = setInterval(() => {
      setDisplayLeagueIndex((prev) => (prev + 1) % options.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [options.length]);
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
  const nextMatchPred = currentMatch ? predictions.find((p) => p.matchId === currentMatch.id) : null;
  const isNextMatchPending = currentMatch && !nextMatchPred;

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

        </div>
      </section>

      <section className="player-dashboard-command">
        {(() => {
          const currentOption = options[displayLeagueIndex] || activeLeague;
          const groupMembers = rankings[currentOption.id] || [];
          const [leader, second, third] = groupMembers;

          return (
            <div className="player-progress-card">
              <div className="player-panel-heading d-flex justify-content-between align-items-center w-100 mb-2">
                <div>
                  <span className="player-kicker">Classificação</span>
                  <h3 className="d-flex align-items-center gap-1.5" style={{ margin: 0 }}>
                    Ranking
                    {options.length > 1 && (
                      <i className="bi bi-arrow-repeat text-secondary animate-spin-slow" style={{ fontSize: '0.85rem' }} />
                    )}
                  </h3>
                </div>
                <span className="badge bg-neon-green bg-opacity-10 text-neon-green border border-neon-green border-opacity-20 px-2 py-0.5 text-uppercase" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                  {currentOption.name}
                </span>
              </div>

              {groupMembers.length === 0 ? (
                <p className="player-empty-text text-center my-3" style={{ fontSize: '0.75rem' }}>Carregando classificação...</p>
              ) : (
                <div key={currentOption.id} className="ranking-podium-container">
                  {second && (
                    <Link href={`/profile/${second.id}`} className="ranking-podium-step step-2 animate__animated animate__fadeInUp" style={{ textDecoration: 'none' }}>
                      <div className="podium-avatar-container">
                        {renderAvatar(second)}
                        <span className="podium-badge tone-silver">2</span>
                      </div>
                      <span className="podium-name">{second.name}</span>
                      <strong className="podium-points">{second.points} pts</strong>
                    </Link>
                  )}
                  {leader && (
                    <Link href={`/profile/${leader.id}`} className="ranking-podium-step step-1 animate__animated animate__fadeInUp" style={{ textDecoration: 'none' }}>
                      <div className="podium-avatar-container">
                        {renderAvatar(leader)}
                        <span className="podium-badge tone-gold"><i className="bi bi-crown-fill" /></span>
                      </div>
                      <span className="podium-name">{leader.name}</span>
                      <strong className="podium-points">{leader.points} pts</strong>
                    </Link>
                  )}
                  {third && (
                    <Link href={`/profile/${third.id}`} className="ranking-podium-step step-3 animate__animated animate__fadeInUp" style={{ textDecoration: 'none' }}>
                      <div className="podium-avatar-container">
                        {renderAvatar(third)}
                        <span className="podium-badge tone-bronze">3</span>
                      </div>
                      <span className="podium-name">{third.name}</span>
                      <strong className="podium-points">{third.points} pts</strong>
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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

      <section className={`player-panel player-next-panel ${isNextMatchPending ? 'needs-guess-pulse' : ''}`}>
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
                  <span className={`urgency-badge ${isNextMatchPending ? 'animate__animated animate__pulse animate__infinite' : ''}`} style={isExpiringSoon ? { color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.22)' } : {}}>
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
                      <div className="d-flex flex-column align-items-center gap-1.5">
                        <span 
                          className="score-pill notranslate" 
                          translate="no" 
                          style={{ 
                            fontWeight: 800,
                            color: '#ef4444', 
                            backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                            borderColor: 'rgba(239, 68, 68, 0.35)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                        >
                          {match.homeScore} x {match.awayScore}
                        </span>
                        {userPred ? (
                          <small className="text-success fw-bold" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                            Seu palpite: {userPred.homeGuess} x {userPred.awayGuess}
                          </small>
                        ) : (
                          <small className="text-warning fw-bold" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                            Você não palpitou
                          </small>
                        )}
                      </div>
                      <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
                    </div>
                  </div>
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
            <h3>Seus palpites</h3>
          </div>
        </div>
        {upcomingPredictions.length > 0 ? (
          <div className="player-compact-list flex-list">
            {upcomingPredictions.map(({ prediction, match }) => (
              <div key={prediction.id} className="player-compact-prediction-row">
                <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                  <small className="date-badge mb-0">{formatDateTimePtBr(match.kickOff)}</small>
                  {match.status === 'live' && (
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.65rem', padding: '0.2rem 0.45rem', fontWeight: 800 }}>
                      <span className="live-pulse" />
                      Ao vivo
                    </span>
                  )}
                </div>
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
            <span className="player-kicker">Resultados recentes</span>
            <h3>Últimos resultados</h3>
          </div>
        </div>
        {recentResults.length > 0 ? (
          <div className="player-compact-list flex-list">
            {recentResults.map(({ prediction, match, points }) => (
              <div key={match.id} className="player-compact-result-row">
                <div className="result-main-info">
                  {points === null ? (
                    <span className="points-badge pts-0">Final</span>
                  ) : (
                    <span className={`points-badge pts-${points}`}>+{points} pts</span>
                  )}
                  <div className="teams-result">
                    <TeamMark name={match.homeTeam} logo={match.homeTeamLogo} flag={match.homeFlag} align="end" />
                    <span className="score-pill notranslate" translate="no">{match.homeScore} x {match.awayScore}</span>
                    <TeamMark name={match.awayTeam} logo={match.awayTeamLogo} flag={match.awayFlag} align="start" />
                  </div>
                </div>
                <small className="guess-label">
                  {prediction
                    ? `Seu palpite: ${prediction.homeGuess} x ${prediction.awayGuess}`
                    : 'Você não palpitou neste jogo'}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="player-empty-text">Nenhum jogo finalizado ainda.</p>
        )}
      </section>

      <details className="player-summary-dropdown player-dashboard-side">
        <summary>
          <div>
            <span className="player-kicker">Regras</span>
            <strong>Pontuação</strong>
          </div>
          <i className="bi bi-chevron-down" aria-hidden="true" />
        </summary>
        <div style={{ padding: '0 16px 16px' }}>
          <div className="player-rule-grid" style={{ marginTop: '8px' }}>
            {[
              { label: 'Exato', points: activeLeague.pointsExact, icon: 'bi-bullseye' },
              { label: 'Total Gols', points: activeLeague.pointsDiff, icon: 'bi-sliders' },
              { label: 'Casa', points: activeLeague.pointsWinnerHome, icon: 'bi-house-door' },
              { label: 'Empate', points: activeLeague.pointsDraw, icon: 'bi-shuffle' },
              { label: 'Fora', points: activeLeague.pointsWinnerAway, icon: 'bi-airplane' },
              { label: 'Ambas sim', points: activeLeague.pointsBothScoreYes, icon: 'bi-check2-circle' },
              { label: 'Ambas não', points: activeLeague.pointsBothScoreNo, icon: 'bi-x-circle' },
            ]
              .filter((rule) => rule.points > 0)
              .map((rule, idx) => (
                <div key={idx}>
                  <span className="rule-icon">
                    <i className={`bi ${rule.icon}`} aria-hidden="true" />
                  </span>
                  <span className="rule-label">{rule.label}</span>
                  <strong>{rule.points}</strong>
                </div>
              ))}
          </div>
          <div className="player-dashboard-note">
            <i className="bi bi-shield-check" aria-hidden="true" />
            <span>{formatJoinPolicyPtBr(activeLeague.joinPolicy)} - máximo de {activeLeague.maxEdits} edições por jogo</span>
          </div>
        </div>
      </details>

      <details className="player-summary-dropdown">
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
    </div>
  );
}
