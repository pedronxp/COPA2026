'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PlayerRouteData } from '@/lib/player-routes-data';
import {
  formatDateTimePtBr,
  formatTimePtBr,
} from '@/lib/pt-br-format';
import { TeamMark } from './team-mark';
import {
  buildMatchFilterOptions,
  buildMatchViewModels,
  filterMatchViewModels,
  getMatchSummaryCounts,
  groupMatchViewModels,
  type MatchFilterValue,
  type MatchViewModel,
} from './matches-view-model';

interface MatchesBoardProps {
  data: PlayerRouteData;
}

function buildInitialGuesses(data: PlayerRouteData) {
  return Object.fromEntries(
    data.predictions.map((prediction) => [
      prediction.matchId,
      {
        home: String(prediction.homeGuess),
        away: String(prediction.awayGuess),
      },
    ]),
  ) as Record<string, { home: string; away: string }>;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'green' | 'cyan' | 'yellow' | 'red';
}) {
  return (
    <div className={`matches-summary-card ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MatchStatsBar({ item }: { item: MatchViewModel }) {
  const stats = item.stats;
  if (!stats || stats.total === 0) {
    return (
      <div className="matches-stats-neutral">
        <i className="bi bi-people" aria-hidden="true" />
        Sem estatisticas neste bolao
      </div>
    );
  }

  return (
    <div className="matches-stats">
      <div className="matches-stats-bar" aria-label="Distribuicao dos palpites">
        <span className="home" style={{ width: `${stats.home}%` }} />
        <span className="draw" style={{ width: `${stats.draw}%` }} />
        <span className="away" style={{ width: `${stats.away}%` }} />
      </div>
      <div className="matches-stats-legend">
        <span>{stats.total} palpites</span>
        <span>Casa {stats.home}%</span>
        <span>Empate {stats.draw}%</span>
        <span>Fora {stats.away}%</span>
      </div>
    </div>
  );
}

export function MatchesBoard({ data }: MatchesBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<MatchFilterValue>('all');
  const [initialNow] = useState(data.generatedAt);
  const [guesses, setGuesses] = useState(buildInitialGuesses(data));
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(
    null,
  );
  const [confirmationModal, setConfirmationModal] = useState<{
    match: MatchViewModel['match'];
    homeGuess: number;
    awayGuess: number;
    editCount: number;
    maxEdits: number;
  } | null>(null);
  const activeLeague = data.leagueContext.activeLeague;

  const viewModels = useMemo(
    () =>
      buildMatchViewModels({
        matches: data.matches,
        predictions: data.predictions,
        stats: data.stats,
        rules: activeLeague,
        now: initialNow,
      }),
    [activeLeague, data.matches, data.predictions, data.stats, initialNow],
  );

  const counts = useMemo(() => getMatchSummaryCounts(viewModels), [viewModels]);
  const filterOptions = useMemo(
    () => buildMatchFilterOptions(viewModels, counts),
    [counts, viewModels],
  );
  const visibleMatches = useMemo(
    () => filterMatchViewModels(viewModels, filter),
    [filter, viewModels],
  );
  const sections = useMemo(() => groupMatchViewModels(visibleMatches), [visibleMatches]);
  const completion =
    counts.total === 0 ? 0 : Math.round((counts.saved / counts.total) * 100);

  function setGuess(matchId: string, side: 'home' | 'away', value: string) {
    if (value !== '' && !/^\d{0,2}$/.test(value)) return;
    setGuesses((current) => ({
      ...current,
      [matchId]: {
        home: side === 'home' ? value : current[matchId]?.home || '',
        away: side === 'away' ? value : current[matchId]?.away || '',
      },
    }));
  }

  function setQuickResult(matchId: string, result: 'home' | 'draw' | 'away') {
    setGuesses((current) => {
      let home = '1';
      let away = '0';
      if (result === 'draw') {
        home = '1';
        away = '1';
      } else if (result === 'away') {
        home = '0';
        away = '1';
      }
      return {
        ...current,
        [matchId]: { home, away },
      };
    });
  }

  async function savePrediction(item: MatchViewModel) {
    const guess = guesses[item.match.id];
    if (!guess || guess.home === '' || guess.away === '') {
      setMessage({ type: 'danger', text: 'Preencha os dois placares antes de salvar.' });
      return;
    }

    setSavingMatchId(item.match.id);
    setMessage(null);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: item.match.id,
          homeGuess: Number(guess.home),
          awayGuess: Number(guess.away),
          leagueId: activeLeague.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'Não foi possível salvar o palpite.',
        );
      }
      setMessage({ type: 'success', text: 'Palpite salvo neste bolão.' });
      setConfirmationModal({
        match: item.match,
        homeGuess: Number(guess.home),
        awayGuess: Number(guess.away),
        editCount: payload.editCount ?? (item.editCount + 1),
        maxEdits: activeLeague.maxEdits,
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error instanceof Error ? error.message : 'Não foi possível salvar o palpite.',
      });
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div className="player-page-stack matches-experience">
      <section className="matches-command-panel">
        <div className="matches-command-copy">
          <span className="player-kicker">Palpites</span>
          <h2>Central de partidas</h2>
          <p>
            {activeLeague.name} tem janela de {activeLeague.windowHours}h, limite de{' '}
            {activeLeague.maxEdits} edicoes e {activeLeague.memberCount} participantes.
          </p>
        </div>

        <div className="matches-rules-grid" aria-label="Regras de pontuacao">
          <span>Exato <strong>{activeLeague.pointsExact}</strong></span>
          <span>Saldo <strong>{activeLeague.pointsDiff}</strong></span>
          <span>Casa <strong>{activeLeague.pointsWinnerHome}</strong></span>
          <span>Empate <strong>{activeLeague.pointsDraw}</strong></span>
          <span>Visitante <strong>{activeLeague.pointsWinnerAway}</strong></span>
        </div>
      </section>

      <section className="matches-summary-grid" aria-label="Resumo dos palpites">
        <StatCard label="Abertos" value={counts.open} tone="green" />
        <StatCard label="Sem palpite" value={counts.unsaved} tone="yellow" />
        <StatCard label="Salvos" value={counts.saved} tone="cyan" />
        <StatCard label="Em breve" value={counts.upcoming} />
        <StatCard label="Bloqueados" value={counts.locked + counts.live + counts.finished} tone="red" />
        <div className="matches-progress-card">
          <span>Progresso</span>
          <strong>{completion}%</strong>
          <div className="matches-progress-track">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>

      {message && (
        <div className={`player-alert ${message.type}`} role="status">
          <i
            className={`bi ${
              message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'
            }`}
            aria-hidden="true"
          />
          {message.text}
        </div>
      )}

      <section className="matches-filter-panel" aria-label="Filtros de partidas">
        {filterOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? 'active' : ''}
            onClick={() => setFilter(item.value)}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </section>

      {sections.length === 0 ? (
        <section className="player-panel player-empty-state">
          <i className="bi bi-calendar-x" aria-hidden="true" />
          <h3>Nenhuma partida neste filtro</h3>
          <p>Troque a visao ativa para ver outras partidas do bolao.</p>
        </section>
      ) : (
        <div className="matches-section-stack">
          {sections.map((section) => (
            <section key={section.key} className="matches-date-section">
              <header className="matches-date-heading">
                <div>
                  <span>{section.matches.length} partidas</span>
                  <h3>{section.label}</h3>
                </div>
              </header>

              <div className="matches-list">
                {section.matches.map((item) => {
                  const guess = guesses[item.match.id] || { home: '', away: '' };
                  const isSaved =
                    item.prediction &&
                    guess.home === String(item.prediction.homeGuess) &&
                    guess.away === String(item.prediction.awayGuess);
                  const isSaving = savingMatchId === item.match.id;
                  const disabled = !item.canEdit || isSaving || isPending || Boolean(isSaved);

                  return (
                    <article
                      key={item.match.id}
                      className={`matches-row ${item.hasPrediction ? 'saved' : ''} ${item.windowStatus}`}
                    >
                      <div className="matches-row-main">
                        <div className="matches-row-time">
                          <span>{formatTimePtBr(item.match.kickOff)}</span>
                          <strong>{item.contextLabel}</strong>
                          <small>{formatDateTimePtBr(item.match.kickOff)}</small>
                        </div>

                        <div className="matches-teams">
                          <TeamMark
                            name={item.match.homeTeam}
                            logo={item.match.homeTeamLogo}
                            flag={item.match.homeFlag}
                            align="end"
                          />
                          <div className="matches-prediction-center">
                            <div className="matches-score-editor">
                              <input
                                aria-label={`Palpite para ${item.match.homeTeam}`}
                                inputMode="numeric"
                                value={guess.home}
                                onChange={(event) =>
                                  setGuess(item.match.id, 'home', event.target.value)
                                }
                                disabled={!item.canEdit}
                                placeholder="-"
                              />
                              <span>x</span>
                              <input
                                aria-label={`Palpite para ${item.match.awayTeam}`}
                                inputMode="numeric"
                                value={guess.away}
                                onChange={(event) =>
                                  setGuess(item.match.id, 'away', event.target.value)
                                }
                                disabled={!item.canEdit}
                                placeholder="-"
                              />
                            </div>
                            <div className="matches-quick-1x2">
                              {(() => {
                                const homeVal = guess.home !== '' ? parseInt(guess.home, 10) : NaN;
                                const awayVal = guess.away !== '' ? parseInt(guess.away, 10) : NaN;
                                const isHomeActive = !isNaN(homeVal) && !isNaN(awayVal) && homeVal > awayVal;
                                const isDrawActive = !isNaN(homeVal) && !isNaN(awayVal) && homeVal === awayVal;
                                const isAwayActive = !isNaN(homeVal) && !isNaN(awayVal) && homeVal < awayVal;

                                return (
                                  <>
                                    <button
                                      type="button"
                                      className={`matches-quick-btn ${isHomeActive ? 'active' : ''}`}
                                      onClick={() => setQuickResult(item.match.id, 'home')}
                                      disabled={!item.canEdit}
                                      title="Vitória do time da casa (Palpita 1x0)"
                                    >
                                      C
                                    </button>
                                    <button
                                      type="button"
                                      className={`matches-quick-btn ${isDrawActive ? 'active' : ''}`}
                                      onClick={() => setQuickResult(item.match.id, 'draw')}
                                      disabled={!item.canEdit}
                                      title="Empate (Palpita 1x1)"
                                    >
                                      X
                                    </button>
                                    <button
                                      type="button"
                                      className={`matches-quick-btn ${isAwayActive ? 'active' : ''}`}
                                      onClick={() => setQuickResult(item.match.id, 'away')}
                                      disabled={!item.canEdit}
                                      title="Vitória do time visitante (Palpita 0x1)"
                                    >
                                      V
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <TeamMark
                            name={item.match.awayTeam}
                            logo={item.match.awayTeamLogo}
                            flag={item.match.awayFlag}
                            align="start"
                          />
                        </div>
                      </div>

                      <div className="matches-row-side">
                        <div className="matches-badge-line">
                          <span className={`matches-window-badge ${item.windowStatus}`}>
                            {item.windowLabel}
                          </span>
                          <span>{item.stageLabel}</span>
                        </div>

                        <MatchStatsBar item={item} />

                        <footer className="matches-row-footer">
                          <span className={item.reachedLimit ? 'danger' : ''}>
                            {item.reachedLimit
                              ? 'Limite de edicoes atingido'
                              : item.prediction
                                ? `Salvo: ${item.prediction.homeGuess} x ${item.prediction.awayGuess}`
                                : 'Sem palpite salvo'}
                            {' · '}
                            {item.editCount}/{activeLeague.maxEdits} edicoes
                          </span>
                          <button
                            type="button"
                            className={isSaved ? 'btn btn-neon-outline' : 'btn btn-neon-green'}
                            onClick={() => savePrediction(item)}
                            disabled={disabled}
                          >
                            {isSaving
                              ? 'Salvando...'
                              : isSaved
                                ? 'Salvo'
                                : item.prediction
                                  ? 'Atualizar'
                                  : 'Salvar'}
                          </button>
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {confirmationModal && (
        <div 
          className="fixed-overlay d-flex align-items-center justify-content-center animate__animated animate__fadeIn"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            padding: '20px'
          }}
        >
          <div 
            className="glass-card p-4 text-center border-success animate__animated animate__zoomIn"
            style={{
              maxWidth: '420px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="d-flex flex-column align-items-center mb-3">
              <div 
                className="d-flex align-items-center justify-content-center bg-success bg-opacity-20 text-success rounded-circle mb-3"
                style={{ width: '60px', height: '60px', border: '1px solid rgba(16, 185, 129, 0.4)' }}
              >
                <i className="bi bi-check-lg fs-2" />
              </div>
              <h4 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)' }}>Palpite Confirmado!</h4>
              <span className="text-secondary mt-1" style={{ fontSize: '0.78rem' }}>Seu palpite foi registrado com sucesso.</span>
            </div>

            <div 
              className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-10 d-flex justify-content-around align-items-center mb-4"
            >
              <div className="d-flex flex-column align-items-center" style={{ width: '40%' }}>
                <TeamMark
                  name={confirmationModal.match.homeTeam}
                  logo={confirmationModal.match.homeTeamLogo}
                  flag={confirmationModal.match.homeFlag}
                  align="center"
                />
              </div>
              <div className="text-center" style={{ width: '20%' }}>
                <div className="fs-3 fw-black text-neon-green animate__animated animate__pulse" style={{ fontFamily: 'var(--font-display)' }}>
                  {confirmationModal.homeGuess} x {confirmationModal.awayGuess}
                </div>
              </div>
              <div className="d-flex flex-column align-items-center" style={{ width: '40%' }}>
                <TeamMark
                  name={confirmationModal.match.awayTeam}
                  logo={confirmationModal.match.awayTeamLogo}
                  flag={confirmationModal.match.awayFlag}
                  align="center"
                />
              </div>
            </div>

            <div className="mb-4 text-center text-secondary" style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-info-circle me-1 text-info" />
              {confirmationModal.editCount >= confirmationModal.maxEdits ? (
                <span className="text-danger fw-semibold">Você atingiu o limite de {confirmationModal.maxEdits} edições para este jogo.</span>
              ) : (
                <span>
                  Você realizou <strong>{confirmationModal.editCount}</strong> de <strong>{confirmationModal.maxEdits}</strong> edições permitidas.
                  <span className="d-block text-success mt-1">
                    Restam <strong>{confirmationModal.maxEdits - confirmationModal.editCount}</strong> {confirmationModal.maxEdits - confirmationModal.editCount === 1 ? 'edição' : 'edições'} disponíveis.
                  </span>
                </span>
              )}
            </div>

            <button 
              type="button" 
              className="btn btn-neon-green w-100 py-2.5 fw-bold text-dark"
              onClick={() => setConfirmationModal(null)}
              style={{ borderRadius: '6px' }}
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
