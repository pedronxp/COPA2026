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

function MatchStatsBar({ item }: { item: MatchViewModel }) {
  const stats = item.stats;
  if (!stats || stats.total === 0) {
    return (
      <div className="matches-stats-neutral">
        <i className="bi bi-people" aria-hidden="true" />
        Sem estatísticas neste bolão
      </div>
    );
  }

  return (
    <div className="matches-stats">
      <div className="matches-stats-bar" aria-label="Distribuição dos palpites">
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

const RULE_EXPLANATIONS = {
  exact: {
    title: 'Placar Exato',
    desc: 'Você ganha estes pontos se acertar o placar cheio do jogo. Exemplo: seu palpite foi 2x1 e o jogo terminou 2x1.',
    icon: 'bi-bullseye'
  },
  diff: {
    title: 'Saldo Correto',
    desc: 'Você ganha estes pontos se acertar o vencedor da partida e a diferença exata de gols, mas errar o número de gols. Exemplo: seu palpite foi 2x0 e o jogo terminou 3x1.',
    icon: 'bi-sliders'
  },
  winnerHome: {
    title: 'Vitória do Mandante (Casa)',
    desc: 'Você ganha estes pontos se acertar apenas o vencedor (time da casa), sem acertar o placar exato ou o saldo correto de gols. Exemplo: seu palpite foi 2x1 e o jogo terminou 1x0.',
    icon: 'bi-house-door'
  },
  draw: {
    title: 'Empate Correto',
    desc: 'Você ganha estes pontos se acertar que a partida terminará empatada, mas com número de gols diferente do seu palpite. Exemplo: seu palpite foi 1x1 e o jogo terminou 2x2.',
    icon: 'bi-shuffle'
  },
  winnerAway: {
    title: 'Vitória do Visitante',
    desc: 'Você ganha estes pontos se acertar apenas o vencedor (time visitante), sem acertar o placar exato ou o saldo correto de gols. Exemplo: seu palpite foi 1x2 e o jogo terminou 0x3.',
    icon: 'bi-airplane'
  },
  bothYes: {
    title: 'Ambas Marcam: Sim',
    desc: 'Bônus somado quando seu palpite indica gols dos dois lados e o resultado também tem gols dos dois times.',
    icon: 'bi-check2-circle'
  },
  bothNo: {
    title: 'Ambas Marcam: Não',
    desc: 'Bônus somado quando seu palpite indica que pelo menos um time não marca e o resultado confirma isso.',
    icon: 'bi-x-circle'
  }
} as const;

function renderRuleIcon(ruleKey: string, className = "football-rule-icon") {
  switch (ruleKey) {
    case 'exact':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7.5L16 10.5L14.5 15.5H9.5L8 10.5L12 7.5Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 2v5.5M12 16.5V22M2 12h5.5M16.5 12H22M4.5 4.5l3.5 3M16 7.5l3.5-3M4.5 19.5l3.5-3M16 16.5l3.5 3" />
        </svg>
      );
    case 'diff':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M3 20V8h18v12" />
          <path d="M3 8l3-4h12l3 4" strokeDasharray="2 2" />
          <path d="M6 4v16M18 4v16M12 4v16" strokeDasharray="2 2" />
          <path d="M3 12h18M3 16h18" strokeDasharray="2 2" />
          <circle cx="12" cy="14" r="2" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case 'winnerHome':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M6 20h12v-9l-3-3H9l-3 3v9z" />
          <path d="M6 11h4M18 11h-4" />
          <path d="M10 8c1 1.5 3 1.5 4 0" />
          <line x1="12" y1="11" x2="12" y2="20" strokeWidth="2.5" />
          <line x1="9" y1="11" x2="9" y2="20" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="15" y1="11" x2="15" y2="20" strokeWidth="1" strokeDasharray="1 1" />
        </svg>
      );
    case 'draw':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M6 14m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M13 9H18a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-5" />
          <path d="M6 12a3 3 0 0 1 3 -3h4" />
          <path d="M3 14v-3a8 8 0 1 1 16 0v3" />
        </svg>
      );
    case 'winnerAway':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M6 20h12v-9l-3-3H9l-3 3v9z" />
          <path d="M6 11h4M18 11h-4" />
          <path d="M10 8c1 1.5 3 1.5 4 0" />
          <line x1="8" y1="20" x2="16" y2="11" strokeWidth="2.5" />
        </svg>
      );
    case 'bothYes':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <circle cx="7" cy="12" r="4" fill="currentColor" fillOpacity="0.1" />
          <path d="M7 8v8M3 12h8" />
          <circle cx="17" cy="12" r="4" fill="currentColor" fillOpacity="0.1" />
          <path d="M17 8v8M13 12h8" />
        </svg>
      );
    case 'bothNo':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="12" cy="11" r="3" />
          <line x1="9.5" y1="8.5" x2="14.5" y2="13.5" />
        </svg>
      );
    default:
      return <i className="bi bi-star" />;
  }
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
  const [activeRuleHelp, setActiveRuleHelp] = useState<keyof typeof RULE_EXPLANATIONS | null>(null);
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
            {activeLeague.maxEdits} edições e {activeLeague.memberCount} participantes.
          </p>
        </div>

        <div className="matches-rules-grid" aria-label="Regras de pontuação">
          {(
            [
              { key: 'exact', label: 'Exato', points: activeLeague.pointsExact, title: 'Placar Exato' },
              { key: 'diff', label: 'Saldo', points: activeLeague.pointsDiff, title: 'Saldo de Gols' },
              { key: 'winnerHome', label: 'Casa', points: activeLeague.pointsWinnerHome, title: 'Vitória do Mandante (Casa)' },
              { key: 'draw', label: 'Empate', points: activeLeague.pointsDraw, title: 'Empate' },
              { key: 'winnerAway', label: 'Visitante', points: activeLeague.pointsWinnerAway, title: 'Vitória do Visitante' },
              { key: 'bothYes', label: 'Ambas sim', points: activeLeague.pointsBothScoreYes, title: 'Ambas Marcam Sim' },
              { key: 'bothNo', label: 'Ambas não', points: activeLeague.pointsBothScoreNo, title: 'Ambas Marcam Não' },
            ] as const
          )
            .filter((rule) => rule.points > 0)
            .map((rule) => (
              <button
                key={rule.key}
                type="button"
                className={`matches-rule-btn-item ${activeRuleHelp === rule.key ? 'active' : ''}`}
                onClick={() => setActiveRuleHelp(activeRuleHelp === rule.key ? null : rule.key)}
                title={`Clique para ver detalhes sobre a regra de ${rule.title}`}
              >
                <span className="matches-rule-btn-content">
                  {renderRuleIcon(rule.key)}
                  <span className="matches-rule-label">{rule.label}</span>
                </span>
                <strong>{rule.points}</strong>
              </button>
            ))}
        </div>
      </section>

      {activeRuleHelp && (
        <div className="matches-rule-explanation-box animate__animated animate__fadeIn">
          <div className="explanation-header">
            <div className="explanation-title-group">
              {renderRuleIcon(activeRuleHelp, "explanation-icon")}
              <div>
                <h3>{RULE_EXPLANATIONS[activeRuleHelp].title}</h3>
                <span className="explanation-points">
                  Esta regra vale <strong>{
                    activeRuleHelp === 'exact' ? activeLeague.pointsExact :
                    activeRuleHelp === 'diff' ? activeLeague.pointsDiff :
                    activeRuleHelp === 'winnerHome' ? activeLeague.pointsWinnerHome :
                    activeRuleHelp === 'draw' ? activeLeague.pointsDraw :
                    activeRuleHelp === 'winnerAway' ? activeLeague.pointsWinnerAway :
                    activeRuleHelp === 'bothYes' ? activeLeague.pointsBothScoreYes :
                    activeLeague.pointsBothScoreNo
                  } pontos</strong> nesta liga
                </span>
              </div>
            </div>
            <button
              type="button"
              className="explanation-close-btn"
              onClick={() => setActiveRuleHelp(null)}
              aria-label="Fechar ajuda"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <p className="explanation-desc">
            {RULE_EXPLANATIONS[activeRuleHelp].desc}
          </p>
        </div>
      )}

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
          <p>Troque a visão ativa para ver outras partidas do bolão.</p>
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
                                      <span className="d-md-none">Casa</span>
                                      <span className="d-none d-md-inline">C</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`matches-quick-btn ${isDrawActive ? 'active' : ''}`}
                                      onClick={() => setQuickResult(item.match.id, 'draw')}
                                      disabled={!item.canEdit}
                                      title="Empate (Palpita 1x1)"
                                    >
                                      <span className="d-md-none">Empate</span>
                                      <span className="d-none d-md-inline">X</span>
                                    </button>
                                    <button
                                      type="button"
                                      className={`matches-quick-btn ${isAwayActive ? 'active' : ''}`}
                                      onClick={() => setQuickResult(item.match.id, 'away')}
                                      disabled={!item.canEdit}
                                      title="Vitória do time visitante (Palpita 0x1)"
                                    >
                                      <span className="d-md-none">Fora</span>
                                      <span className="d-none d-md-inline">V</span>
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
                              ? 'Limite de edições atingido'
                              : item.prediction
                                ? `Salvo: ${item.prediction.homeGuess} x ${item.prediction.awayGuess}`
                                : 'Sem palpite salvo'}
                            {' · '}
                            {item.editCount}/{activeLeague.maxEdits} edições
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
