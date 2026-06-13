'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PlayerRouteData } from '@/lib/player-routes-data';
import type { PredictionData } from '@/lib/matches-service';
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
import {
  BOTH_TEAMS_SCORE_LABELS,
  RESULT_PICK_LABELS,
  TOTAL_GOALS_OPTIONS,
  formatBothTeamsScorePick,
  formatResultPick,
  formatTotalGoalsPick,
  deriveBothTeamsScorePick,
  deriveResultPick,
  deriveTotalGoalsPick,
  type BothTeamsScorePick,
  type ResultPick,
  type TotalGoalsPick,
} from '@/lib/prediction-markets';
import { calculatePredictionScore } from '@/lib/scoring-domain';

function renderScoreBadges(scoreDetails: any) {
  if (!scoreDetails) return null;
  const badges = [];

  if (scoreDetails.exactScore > 0) {
    badges.push(
      <span 
        key="exact"
        style={{
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-bullseye" style={{ fontSize: '0.72rem' }} /> Placar Exato
      </span>
    );
  }

  if (scoreDetails.result > 0) {
    let label = 'Resultado';
    if (scoreDetails.resultKind === 'home') label = 'Vencedor Casa';
    if (scoreDetails.resultKind === 'away') label = 'Vencedor Fora';
    if (scoreDetails.resultKind === 'draw') label = 'Empate';
    
    badges.push(
      <span 
        key="result"
        style={{
          background: 'rgba(139, 92, 246, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-trophy" style={{ fontSize: '0.72rem' }} /> {label}
      </span>
    );
  }

  if (scoreDetails.totalGoals > 0) {
    badges.push(
      <span 
        key="goals"
        style={{
          background: 'rgba(6, 182, 212, 0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-hash" style={{ fontSize: '0.72rem' }} /> Total de Gols
      </span>
    );
  }

  if (scoreDetails.bothTeamsScore > 0) {
    badges.push(
      <span 
        key="both"
        style={{
          background: 'rgba(20, 184, 166, 0.12)',
          color: '#2dd4bf',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-arrow-left-right" style={{ fontSize: '0.72rem' }} /> Ambas Marcam
      </span>
    );
  }

  if (badges.length === 0) {
    badges.push(
      <span 
        key="none"
        style={{
          background: 'rgba(100, 116, 139, 0.1)',
          color: '#94a3b8',
          border: '1px solid rgba(100, 116, 139, 0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.68rem',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px'
        }}
      >
        <i className="bi bi-x-circle" style={{ fontSize: '0.72rem' }} /> Sem Pontos
      </span>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-1 mt-2 justify-content-center align-items-center">
      {badges}
    </div>
  );
}

function renderCompactScoreBadges(scoreDetails: any) {
  if (!scoreDetails) return null;
  const badges = [];

  if (scoreDetails.exactScore > 0) {
    badges.push(
      <span 
        key="exact"
        title="Placar Exato"
        style={{
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.6rem',
          fontWeight: '600'
        }}
      >
        Exato
      </span>
    );
  }

  if (scoreDetails.result > 0) {
    badges.push(
      <span 
        key="result"
        title="Resultado"
        style={{
          background: 'rgba(139, 92, 246, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.6rem',
          fontWeight: '600'
        }}
      >
        Vencedor
      </span>
    );
  }

  if (scoreDetails.totalGoals > 0) {
    badges.push(
      <span 
        key="goals"
        title="Total de Gols"
        style={{
          background: 'rgba(6, 182, 212, 0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.6rem',
          fontWeight: '600'
        }}
      >
        Gols
      </span>
    );
  }

  if (scoreDetails.bothTeamsScore > 0) {
    badges.push(
      <span 
        key="both"
        title="Ambas Marcam"
        style={{
          background: 'rgba(20, 184, 166, 0.12)',
          color: '#2dd4bf',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.6rem',
          fontWeight: '600'
        }}
      >
        Ambas
      </span>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="d-flex gap-1 mt-1 justify-content-end align-items-center">
      {badges}
    </div>
  );
}

interface MatchesBoardProps {
  data: PlayerRouteData;
}

function formatMatchday(matchday: string | null | undefined) {
  if (!matchday) return '';
  const num = parseInt(matchday, 10);
  if (!isNaN(num)) {
    return `${num}ª rodada`;
  }
  return matchday;
}

function buildInitialGuesses(data: PlayerRouteData) {
  const predictionMap = new Map(data.predictions.map((p) => [p.matchId, p]));
  return Object.fromEntries(
    data.matches.map((match) => {
      const pred = predictionMap.get(match.id);
      if (pred) {
        return [
          match.id,
          {
            home: String(pred.homeGuess),
            away: String(pred.awayGuess),
          },
        ];
      }
      if (match.status === 'finished' && match.homeScore !== null && match.awayScore !== null) {
        return [
          match.id,
          {
            home: String(match.homeScore),
            away: String(match.awayScore),
          },
        ];
      }
      return [match.id, { home: '', away: '' }];
    })
  ) as Record<string, { home: string; away: string }>;
}

function buildInitialMarketPicks(data: PlayerRouteData) {
  const predictionMap = new Map(data.predictions.map((p) => [p.matchId, p]));
  return Object.fromEntries(
    data.matches.map((match) => {
      const pred = predictionMap.get(match.id);
      if (pred) {
        return [
          match.id,
          {
            resultPick: pred.resultPick,
            totalGoalsPick: pred.totalGoalsPick,
            bothTeamsScorePick: pred.bothTeamsScorePick,
          },
        ];
      }
      if (match.status === 'finished' && match.homeScore !== null && match.awayScore !== null) {
        return [
          match.id,
          {
            resultPick: deriveResultPick(match.homeScore, match.awayScore),
            totalGoalsPick: deriveTotalGoalsPick(match.homeScore, match.awayScore),
            bothTeamsScorePick: deriveBothTeamsScorePick(match.homeScore, match.awayScore),
          },
        ];
      }
      return [
        match.id,
        {
          resultPick: '',
          totalGoalsPick: '',
          bothTeamsScorePick: '',
        },
      ];
    })
  ) as Record<
    string,
    {
      resultPick: ResultPick | '';
      totalGoalsPick: TotalGoalsPick | '';
      bothTeamsScorePick: BothTeamsScorePick | '';
    }
  >;
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
      <div className="matches-stats-legend" style={{ justifyContent: 'center' }}>
        <span>{stats.total} {stats.total === 1 ? 'palpite' : 'palpites'}</span>
      </div>
    </div>
  );
}

const RULE_EXPLANATIONS = {
  exact: {
    title: 'Placar exato',
    desc: 'Você ganha estes pontos quando acerta os gols dos dois times. Exemplo: seu palpite foi 2x1 e a partida terminou 2x1.',
    icon: 'bi-bullseye'
  },
  diff: {
    title: 'Total de gols',
    desc: 'Voce ganha estes pontos quando acerta a faixa de gols escolhida no mercado Over/Under. Over 5.5+ vale para 6 ou mais gols, sem limite maximo.',
    icon: 'bi-sliders'
  },
  winnerHome: {
    title: 'Resultado da partida: casa',
    desc: 'Voce ganha estes pontos quando escolhe casa vence e o time da casa vence.',
    icon: 'bi-house-door'
  },
  draw: {
    title: 'Resultado da partida: empate',
    desc: 'Você ganha estes pontos quando acerta que a partida termina empatada, mas com outro placar. Exemplo: palpite 1x1 e resultado 2x2.',
    icon: 'bi-shuffle'
  },
  winnerAway: {
    title: 'Resultado da partida: visitante',
    desc: 'Voce ganha estes pontos quando escolhe fora vence e o visitante vence.',
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
  const [filter, setFilter] = useState<MatchFilterValue>('open');
  const [initialNow] = useState(data.generatedAt);
  const [guesses, setGuesses] = useState(buildInitialGuesses(data));
  const [marketPicks, setMarketPicks] = useState(buildInitialMarketPicks(data));
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
  const [viewPredictionModal, setViewPredictionModal] = useState<{
    match: MatchViewModel['match'];
    prediction: PredictionData;
    editCount: number;
    maxEdits: number;
  } | null>(null);
  const [viewGroupPredictionsModal, setViewGroupPredictionsModal] = useState<{
    match: MatchViewModel['match'];
  } | null>(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [activeRuleHelp, setActiveRuleHelp] = useState<keyof typeof RULE_EXPLANATIONS | null>(null);
  const activeLeague = data.leagueContext.activeLeague;

  const [memberPredictions, setMemberPredictions] = useState<any[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberLoadError, setMemberLoadError] = useState<string | null>(null);

  const activeMatchForGroup = useMemo(() => {
    return viewPredictionModal?.match || viewGroupPredictionsModal?.match || null;
  }, [viewPredictionModal, viewGroupPredictionsModal]);

  const isMatchClosed = useMemo(() => {
    if (!activeMatchForGroup) return false;
    const now = Date.now();
    const kickoff = new Date(activeMatchForGroup.kickOff).getTime();
    const limit = kickoff - 30 * 60 * 1000;
    return activeMatchForGroup.status !== 'scheduled' || now > limit;
  }, [activeMatchForGroup]);

  useEffect(() => {
    if (!activeMatchForGroup || !isMatchClosed) {
      setMemberPredictions(null);
      setMemberLoadError(null);
      return;
    }

    const targetMatchId = activeMatchForGroup.id;

    async function loadMembers() {
      setLoadingMembers(true);
      setMemberLoadError(null);
      try {
        const res = await fetch(`/api/predictions?leagueId=${activeLeague.id}&matchId=${targetMatchId}`);
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Não foi possível carregar os palpites dos outros membros.');
        }
        setMemberPredictions(resData.predictions);
      } catch (err: any) {
        setMemberLoadError(err.message);
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, [activeMatchForGroup, isMatchClosed, activeLeague.id]);

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

  function setMarketPick(
    matchId: string,
    field: 'resultPick' | 'totalGoalsPick' | 'bothTeamsScorePick',
    value: string,
  ) {
    setMarketPicks((current) => ({
      ...current,
      [matchId]: {
        resultPick: current[matchId]?.resultPick || '',
        totalGoalsPick: current[matchId]?.totalGoalsPick || '',
        bothTeamsScorePick: current[matchId]?.bothTeamsScorePick || '',
        [field]: value as ResultPick & TotalGoalsPick & BothTeamsScorePick,
      },
    }));
  }

  async function savePrediction(item: MatchViewModel) {
    const guess = guesses[item.match.id];
    const picks = marketPicks[item.match.id];
    if (!guess || guess.home === '' || guess.away === '') {
      setMessage({ type: 'danger', text: 'Preencha os dois placares antes de salvar.' });
      return;
    }
    if (!picks?.resultPick || !picks.totalGoalsPick || !picks.bothTeamsScorePick) {
      setMessage({
        type: 'danger',
        text: 'Escolha resultado, total de gols e ambas marcam antes de salvar.',
      });
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
          resultPick: picks.resultPick,
          totalGoalsPick: picks.totalGoalsPick,
          bothTeamsScorePick: picks.bothTeamsScorePick,
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
            Faça seus palpites no {activeLeague.name}. Toque em uma regra para entender como ela pontua antes de salvar.
          </p>
          <div className="matches-score-guide" aria-label="Guia rápido de pontuação">
            <span><i className="bi bi-bullseye" aria-hidden="true" /> Placar exato: gols iguais ao jogo</span>
            <span><i className="bi bi-arrows-expand" aria-hidden="true" /> Total: Over/Under de gols</span>
            <span><i className="bi bi-flag" aria-hidden="true" /> Resultado: casa, empate ou visitante</span>
          </div>
        </div>

        <div className="matches-rules-grid" aria-label="Regras de pontuação">
          {(
            [
              { key: 'exact', label: 'Placar', points: activeLeague.pointsExact, title: 'Placar exato' },
              { key: 'diff', label: 'Total gols', points: activeLeague.pointsDiff, title: 'Total de gols' },
              { key: 'winnerHome', label: 'Casa vence', points: activeLeague.pointsWinnerHome, title: 'Resultado: casa vence' },
              { key: 'draw', label: 'Empate', points: activeLeague.pointsDraw, title: 'Resultado: empate' },
              { key: 'winnerAway', label: 'Fora vence', points: activeLeague.pointsWinnerAway, title: 'Resultado: visitante vence' },
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
                  } pontos</strong> neste bolão
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
                  const picks = marketPicks[item.match.id] || {
                    resultPick: '',
                    totalGoalsPick: '',
                    bothTeamsScorePick: '',
                  };
                  const isSaved =
                    item.prediction &&
                    guess.home === String(item.prediction.homeGuess) &&
                    guess.away === String(item.prediction.awayGuess) &&
                    picks.resultPick === item.prediction.resultPick &&
                    picks.totalGoalsPick === item.prediction.totalGoalsPick &&
                    picks.bothTeamsScorePick === item.prediction.bothTeamsScorePick;
                  const isSaving = savingMatchId === item.match.id;
                  const disabled = !item.canEdit || isSaving || isPending || Boolean(isSaved);

                  return (
                    <article
                      key={item.match.id}
                      className={`matches-row ${item.hasPrediction ? 'saved' : ''} ${item.windowStatus}`}
                    >
                      <div className="matches-row-main">
                        <div className="matches-row-time">
                          <strong>
                            {item.contextLabel}
                            {item.match.matchday && ` • ${formatMatchday(item.match.matchday)}`}
                          </strong>
                          <small>{formatDateTimePtBr(item.match.kickOff)}</small>
                        </div>

                        <div className="matches-row-content">
                          <div className="matches-teams">
                            <TeamMark
                              name={item.match.homeTeam}
                              logo={item.match.homeTeamLogo}
                              flag={item.match.homeFlag}
                              align="end"
                            />
                            <div className="matches-prediction-center">
                              {activeLeague.pointsExact > 0 || activeLeague.pointsDiff > 0 ? (
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
                              ) : (
                                <div className="matches-score-display">
                                  <span>{guess.home !== '' ? guess.home : '-'}</span>
                                  <span>x</span>
                                  <span>{guess.away !== '' ? guess.away : '-'}</span>
                                </div>
                              )}
                            </div>
                            <TeamMark
                              name={item.match.awayTeam}
                              logo={item.match.awayTeamLogo}
                              flag={item.match.awayFlag}
                              align="start"
                            />
                          </div>

                          <div className="matches-market-selectors">
                            <label>
                              <span>Resultado</span>
                              <select
                                value={picks.resultPick}
                                onChange={(event) =>
                                  setMarketPick(item.match.id, 'resultPick', event.target.value)
                                }
                                disabled={!item.canEdit}
                                aria-label={`Resultado para ${item.match.homeTeam} contra ${item.match.awayTeam}`}
                              >
                                <option value="">Escolha</option>
                                {(['home', 'draw', 'away'] as const).map((value) => (
                                  <option key={value} value={value}>
                                    {RESULT_PICK_LABELS[value]}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>Total de gols</span>
                              <select
                                value={picks.totalGoalsPick}
                                onChange={(event) =>
                                  setMarketPick(item.match.id, 'totalGoalsPick', event.target.value)
                                }
                                disabled={!item.canEdit}
                                aria-label={`Total de gols para ${item.match.homeTeam} contra ${item.match.awayTeam}`}
                              >
                                <option value="">Escolha</option>
                                {TOTAL_GOALS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label} - {option.description}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>Ambas marcam</span>
                              <select
                                value={picks.bothTeamsScorePick}
                                onChange={(event) =>
                                  setMarketPick(
                                    item.match.id,
                                    'bothTeamsScorePick',
                                    event.target.value,
                                  )
                                }
                                disabled={!item.canEdit}
                                aria-label={`Ambas marcam para ${item.match.homeTeam} contra ${item.match.awayTeam}`}
                              >
                                <option value="">Escolha</option>
                                {(['yes', 'no'] as const).map((value) => (
                                  <option key={value} value={value}>
                                    {BOTH_TEAMS_SCORE_LABELS[value]}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
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
                          {item.match.status === 'finished' ? (
                            (() => {
                              const scoreDetails = item.prediction
                                ? calculatePredictionScore(
                                    item.prediction.homeGuess,
                                    item.prediction.awayGuess,
                                    item.match.homeScore!,
                                    item.match.awayScore!,
                                    activeLeague,
                                    {
                                      resultPick: item.prediction.resultPick as any,
                                      totalGoalsPick: item.prediction.totalGoalsPick as any,
                                      bothTeamsScorePick: item.prediction.bothTeamsScorePick as any,
                                    }
                                  )
                                : null;

                              return item.prediction ? (
                                <div className="w-100">
                                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div className="d-flex flex-column gap-1 align-items-start">
                                      <span className="prediction-score-text" style={{ fontSize: '0.85rem' }}>
                                        Seu palpite: <strong>{item.prediction.homeGuess} x {item.prediction.awayGuess}</strong>
                                      </span>
                                      <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                                        Resultado oficial: {item.match.homeScore} x {item.match.awayScore}
                                      </small>
                                      {scoreDetails && (
                                        <div className="d-flex align-items-center gap-2 mt-0.5">
                                          <span className="badge py-1 px-1.5 rounded" style={{
                                            background: scoreDetails.total > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                                            color: scoreDetails.total > 0 ? '#10b981' : '#94a3b8',
                                            border: scoreDetails.total > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.2)',
                                            fontSize: '0.75rem',
                                            fontWeight: '700'
                                          }}>
                                            +{scoreDetails.total} pts
                                          </span>
                                          {renderCompactScoreBadges(scoreDetails)}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className="btn-view-group"
                                      onClick={() =>
                                        setViewGroupPredictionsModal({
                                          match: item.match,
                                        })
                                      }
                                      title="Ver palpites do grupo"
                                    >
                                      <i className="bi bi-people" aria-hidden="true" />
                                      <span>Grupo</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-100 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                  <div className="d-flex flex-column align-items-start gap-1">
                                    <span className="text-warning" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <i className="bi bi-exclamation-triangle-fill"></i>
                                      Você não fez este palpite
                                    </span>
                                    <small className="text-secondary" style={{ fontSize: '0.72rem' }}>
                                      O resultado oficial foi: {item.match.homeScore} x {item.match.awayScore}
                                    </small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-view-group"
                                    onClick={() =>
                                      setViewGroupPredictionsModal({
                                        match: item.match,
                                      })
                                    }
                                    title="Ver palpites do grupo"
                                  >
                                    <i className="bi bi-people" aria-hidden="true" />
                                    <span>Grupo</span>
                                  </button>
                                </div>
                              );
                            })()
                          ) : (
                            item.prediction ? (
                              <div className="matches-row-prediction-badge w-100">
                                <div className="prediction-label-group">
                                  <span className="prediction-glow-dot" />
                                  <span className="prediction-score-text">
                                    Seu palpite: <strong>{item.prediction.homeGuess} x {item.prediction.awayGuess}</strong>
                                  </span>
                                </div>
                                <div className="d-flex gap-1.5 flex-shrink-0 align-items-center">
                                  <button
                                    type="button"
                                    className="btn-view-group"
                                    onClick={() =>
                                      setViewGroupPredictionsModal({
                                        match: item.match,
                                      })
                                    }
                                    title="Ver palpites do grupo"
                                  >
                                    <i className="bi bi-people" aria-hidden="true" />
                                    <span>Grupo</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={isSaved ? 'btn btn-neon-outline btn-sm' : 'btn btn-neon-green btn-sm'}
                                    onClick={() => savePrediction(item)}
                                    disabled={disabled}
                                  >
                                    {isSaving
                                      ? 'Salvando...'
                                      : isSaved
                                        ? 'Salvo'
                                        : 'Atualizar'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center justify-content-between w-100 gap-2">
                                <span className={item.reachedLimit ? 'danger' : 'text-secondary'} style={{ fontSize: '0.85rem' }}>
                                  {item.reachedLimit ? 'Limite de alterações atingido' : 'Você ainda não palpitou'}
                                </span>
                                <div className="d-flex gap-1.5 align-items-center">
                                  <button
                                    type="button"
                                    className="btn-view-group"
                                    onClick={() =>
                                      setViewGroupPredictionsModal({
                                        match: item.match,
                                      })
                                    }
                                    title="Ver palpites do grupo"
                                  >
                                    <i className="bi bi-people" aria-hidden="true" />
                                    <span>Grupo</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-neon-green btn-sm"
                                    onClick={() => savePrediction(item)}
                                    disabled={disabled}
                                  >
                                    {isSaving ? 'Salvando...' : 'Salvar'}
                                  </button>
                                </div>
                              </div>
                            )
                          )}
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

      {viewPredictionModal && (
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
            className="glass-card p-4 border-info animate__animated animate__zoomIn"
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info rounded-circle"
                  style={{ width: '32px', height: '32px', border: '1px solid rgba(14, 165, 233, 0.2)' }}
                >
                  <svg className="football-rule-icon text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1rem', height: '1rem' }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 7.5L16 10.5L14.5 15.5H9.5L8 10.5L12 7.5Z" fill="currentColor" fillOpacity="0.15" />
                    <path d="M12 2v5.5M12 16.5V22M2 12h5.5M16.5 12H22M4.5 4.5l3.5 3M16 7.5l3.5-3M4.5 19.5l3.5-3M16 16.5l3.5 3" />
                  </svg>
                </div>
                <h4 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Seu Palpite</h4>
              </div>
              <button
                type="button"
                className="border-0 bg-transparent text-secondary hover-text-white d-flex align-items-center justify-content-center"
                onClick={() => setViewPredictionModal(null)}
                style={{ cursor: 'pointer', transition: 'color 0.2s', fontSize: '1.2rem', padding: '4px' }}
                aria-label="Fechar modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            {/* Match Heading */}
            <div className="text-center mb-3">
              <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                {viewPredictionModal.match.stage} • {viewPredictionModal.match.group ? `Grupo ${viewPredictionModal.match.group}` : 'Fase Final'}
              </span>
            </div>

            {/* Scoreboard Preview */}
            <div 
              className="p-3 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-10 d-flex justify-content-around align-items-center mb-4"
              style={{ background: 'rgba(8, 12, 20, 0.4)' }}
            >
              <div className="d-flex flex-column align-items-center text-center" style={{ width: '38%' }}>
                <TeamMark
                  name={viewPredictionModal.match.homeTeam}
                  logo={viewPredictionModal.match.homeTeamLogo}
                  flag={viewPredictionModal.match.homeFlag}
                  align="center"
                />
              </div>
              <div className="text-center" style={{ width: '24%' }}>
                <div className="fs-2 fw-black text-info animate__animated animate__pulse" style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 15px rgba(14, 165, 233, 0.4)' }}>
                  {viewPredictionModal.prediction.homeGuess} x {viewPredictionModal.prediction.awayGuess}
                </div>
              </div>
              <div className="d-flex flex-column align-items-center text-center" style={{ width: '38%' }}>
                <TeamMark
                  name={viewPredictionModal.match.awayTeam}
                  logo={viewPredictionModal.match.awayTeamLogo}
                  flag={viewPredictionModal.match.awayFlag}
                  align="center"
                />
              </div>
            </div>

            {/* Markets details */}
            <div className="d-flex flex-column gap-2 mb-4">
              <div className="prediction-detail-market-card">
                <div className="market-card-left">
                  <div className="market-card-icon">
                    <i className="bi bi-flag" aria-hidden="true" />
                  </div>
                  <span>Resultado</span>
                </div>
                <div className="market-card-value">
                  {formatResultPick(viewPredictionModal.prediction.resultPick)}
                </div>
              </div>

              <div className="prediction-detail-market-card">
                <div className="market-card-left">
                  <div className="market-card-icon">
                    <i className="bi bi-arrows-expand" aria-hidden="true" />
                  </div>
                  <span>Total de Gols</span>
                </div>
                <div className="market-card-value">
                  {formatTotalGoalsPick(viewPredictionModal.prediction.totalGoalsPick)}
                </div>
              </div>

              <div className="prediction-detail-market-card">
                <div className="market-card-left">
                  <div className="market-card-icon">
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                  </div>
                  <span>Ambas Marcam</span>
                </div>
                <div className="market-card-value">
                  {formatBothTeamsScorePick(viewPredictionModal.prediction.bothTeamsScorePick)}
                </div>
              </div>
            </div>

            {/* Highlight points or edit count */}
            {(() => {
              const matchHomeScore = viewPredictionModal?.match?.homeScore;
              const matchAwayScore = viewPredictionModal?.match?.awayScore;
              const isFinished = viewPredictionModal?.match?.status === 'finished' && matchHomeScore !== null && matchAwayScore !== null;
              
              const myScoreDetails = isFinished && viewPredictionModal
                ? calculatePredictionScore(
                    viewPredictionModal.prediction.homeGuess,
                    viewPredictionModal.prediction.awayGuess,
                    matchHomeScore,
                    matchAwayScore,
                    activeLeague,
                    {
                      resultPick: viewPredictionModal.prediction.resultPick as any,
                      totalGoalsPick: viewPredictionModal.prediction.totalGoalsPick as any,
                      bothTeamsScorePick: viewPredictionModal.prediction.bothTeamsScorePick as any,
                    }
                  )
                : null;

              return isFinished ? (
                <div 
                  className="p-3 mb-4 rounded border text-center animate__animated animate__fadeIn"
                  style={{
                    background: myScoreDetails && myScoreDetails.total > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(100, 116, 139, 0.05)',
                    borderColor: myScoreDetails && myScoreDetails.total > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.15)'
                  }}
                >
                  <div className="fs-6 fw-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Você marcou <span className={myScoreDetails && myScoreDetails.total > 0 ? 'text-neon-green fs-5' : 'text-secondary fs-5'}>
                      {myScoreDetails?.total ?? 0}
                    </span> pontos nesta partida!
                  </div>
                  {renderScoreBadges(myScoreDetails)}
                </div>
              ) : (
                <div className="mb-4 text-center text-secondary" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-info-circle me-1 text-info" aria-hidden="true" />
                  <span>
                    Palpite editado <strong>{viewPredictionModal.editCount}</strong> de <strong>{viewPredictionModal.maxEdits}</strong> vezes permitidas.
                  </span>
                </div>
              );
            })()}

            <button 
              type="button" 
              className="btn btn-neon-outline w-100 py-2.5 fw-bold"
              onClick={() => setViewPredictionModal(null)}
              style={{ borderRadius: '6px' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {viewGroupPredictionsModal && (
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
            className="glass-card p-4 border-info animate__animated animate__zoomIn"
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.98) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-10">
              <div className="d-flex align-items-center gap-2">
                <div 
                  className="d-flex align-items-center justify-content-center bg-purple bg-opacity-10 text-purple rounded-circle"
                  style={{ width: '32px', height: '32px', border: '1px solid rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#ddd6fe' }}
                >
                  <i className="bi bi-people-fill" />
                </div>
                <h4 className="text-white fw-bold m-0" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Palpites do Grupo</h4>
              </div>
              <button
                type="button"
                className="border-0 bg-transparent text-secondary hover-text-white d-flex align-items-center justify-content-center"
                onClick={() => {
                  setViewGroupPredictionsModal(null);
                  setGroupSearchQuery('');
                }}
                style={{ cursor: 'pointer', transition: 'color 0.2s', fontSize: '1.2rem', padding: '4px' }}
                aria-label="Fechar modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            {/* Jogo info */}
            <div className="text-center mb-3">
              <span className="text-secondary text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                {viewGroupPredictionsModal.match.stage} • {viewGroupPredictionsModal.match.group ? `Grupo ${viewGroupPredictionsModal.match.group}` : 'Fase Final'}
              </span>
              <div className="d-flex align-items-center justify-content-center gap-2 mt-1">
                <span className="text-white fw-bold" style={{ fontSize: '0.9rem' }}>{viewGroupPredictionsModal.match.homeTeam}</span>
                <span className="text-secondary fw-bold" style={{ fontSize: '0.8rem' }}>vs</span>
                <span className="text-white fw-bold" style={{ fontSize: '0.9rem' }}>{viewGroupPredictionsModal.match.awayTeam}</span>
              </div>
            </div>

            {!isMatchClosed ? (
              <div className="p-4 rounded bg-dark bg-opacity-30 border border-secondary border-opacity-10 text-center text-secondary my-4" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-lock-fill me-1.5 text-warning fs-5" aria-hidden="true" />
                <p className="mt-2 mb-0">Os palpites dos outros membros deste bolão só ficarão visíveis 30 minutos antes do início da partida.</p>
              </div>
            ) : (
              <>
                {/* Campo de Busca */}
                <div className="mb-3">
                  <div className="input-group" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <span 
                      className="input-group-text bg-dark border-secondary border-opacity-20 text-secondary" 
                      style={{ borderRight: 'none', borderRadius: '20px 0 0 20px' }}
                    >
                      <i className="bi bi-search" />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary border-opacity-20 text-white"
                      style={{ 
                        fontSize: '0.85rem', 
                        borderLeft: 'none', 
                        borderRight: groupSearchQuery ? 'none' : undefined,
                        borderRadius: groupSearchQuery ? '0' : '0 20px 20px 0' 
                      }}
                      placeholder="Buscar participante..."
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                    />
                    {groupSearchQuery && (
                      <button
                        className="btn btn-outline-secondary border-secondary border-opacity-20 text-secondary bg-dark"
                        type="button"
                        onClick={() => setGroupSearchQuery('')}
                        style={{ borderLeft: 'none', borderRadius: '0 20px 20px 0' }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                </div>

                {loadingMembers ? (
                  <div className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>Carregando palpites dos competidores...</span>
                  </div>
                ) : memberLoadError ? (
                  <div className="p-3 rounded bg-danger bg-opacity-10 border border-danger border-opacity-20 text-danger text-center" style={{ fontSize: '0.8rem' }}>
                    <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                    {memberLoadError}
                  </div>
                ) : (() => {
                  const filteredPredictions = (memberPredictions || [])
                    .filter((m: any) => m.hasPrediction) // Somente membros que fizeram palpites
                    .filter((m: any) => m.name.toLowerCase().includes(groupSearchQuery.toLowerCase())); // Filtro de busca

                  return filteredPredictions.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mb-4" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {(() => {
                        const matchHomeScore = viewGroupPredictionsModal.match.homeScore;
                        const matchAwayScore = viewGroupPredictionsModal.match.awayScore;
                        const isFinished = viewGroupPredictionsModal.match.status === 'finished' && matchHomeScore !== null && matchAwayScore !== null;

                        return filteredPredictions.map((memberPred: any) => {
                          const charCode = memberPred.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                          const hue = charCode % 360;
                          const avatarStyle = {
                            background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 45) % 360}, 75%, 35%))`,
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: 0
                          };

                          const memberScoreDetails = isFinished && memberPred.hasPrediction
                            ? calculatePredictionScore(
                                memberPred.homeGuess,
                                memberPred.awayGuess,
                                matchHomeScore,
                                matchAwayScore,
                                activeLeague,
                                {
                                  resultPick: memberPred.resultPick as any,
                                  totalGoalsPick: memberPred.totalGoalsPick as any,
                                  bothTeamsScorePick: memberPred.bothTeamsScorePick as any,
                                }
                              )
                            : null;
                          const memberPoints = memberScoreDetails?.total ?? memberPred.points ?? 0;
                          const isRealImage = memberPred.image && (memberPred.image.startsWith('http') || memberPred.image.startsWith('/'));

                          return (
                            <div 
                              key={memberPred.userId} 
                              className="d-flex align-items-center justify-content-between p-2.5"
                              style={{ 
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              <div className="d-flex align-items-center gap-2.5">
                                {isRealImage ? (
                                  <img 
                                    src={memberPred.image} 
                                    alt={memberPred.name} 
                                    className="rounded-circle flex-shrink-0"
                                    style={{ width: '28px', height: '28px', objectFit: 'cover', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                                  />
                                ) : (
                                  <div style={avatarStyle}>
                                    {memberPred.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="d-flex flex-column">
                                  <span className="text-white fw-bold" style={{ fontSize: '0.82rem' }}>{memberPred.name}</span>
                                  <small className="text-secondary" style={{ fontSize: '0.62rem', opacity: 0.8 }}>
                                    {memberPred.role === 'owner' ? '👑 Criador' : memberPred.role === 'subadmin' ? '🛡️ Subadmin' : '👤 Membro'}
                                  </small>
                                </div>
                              </div>

                              <div className="text-end">
                                <div className="d-flex flex-column align-items-end gap-1">
                                  <div className="d-flex align-items-center gap-2 justify-content-end">
                                    <div 
                                      className="px-2 py-0.5 rounded text-center" 
                                      style={{ 
                                        background: 'rgba(15, 23, 42, 0.5)', 
                                        border: '1px solid rgba(14, 165, 233, 0.2)',
                                        minWidth: '52px' 
                                      }}
                                    >
                                      <span className="text-info fw-bold" style={{ fontSize: '0.8rem' }}>
                                        {memberPred.homeGuess} x {memberPred.awayGuess}
                                      </span>
                                    </div>
                                    {isFinished && (
                                      <span 
                                        className="badge fw-bold" 
                                        style={{ 
                                          fontSize: '0.68rem',
                                          background: memberPoints > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.1)',
                                          color: memberPoints > 0 ? '#10b981' : '#64748b',
                                          border: memberPoints > 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(100, 116, 139, 0.15)',
                                          padding: '3px 6px',
                                          borderRadius: '4px'
                                        }}
                                      >
                                        {memberPoints > 0 ? `+${memberPoints}` : '0'} pts
                                      </span>
                                    )}
                                  </div>
                                  <div className="d-flex align-items-center gap-1 justify-content-end">
                                    {isFinished ? (
                                      renderCompactScoreBadges(memberScoreDetails)
                                    ) : (
                                      <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                                        {RESULT_PICK_LABELS[memberPred.resultPick as 'home'|'draw'|'away'] || 'Vencedor'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary mb-4" style={{ fontSize: '0.8rem' }}>
                      Nenhum palpite correspondente encontrado.
                    </div>
                  );
                })()}
              </>
            )}

            <button 
              type="button" 
              className="btn btn-neon-outline w-100 py-2.5 fw-bold"
              onClick={() => {
                setViewGroupPredictionsModal(null);
                setGroupSearchQuery('');
              }}
              style={{ 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.25) 100%)',
                borderColor: 'rgba(139, 92, 246, 0.4)',
                color: '#ddd6fe',
                transition: 'all 0.2s ease',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
