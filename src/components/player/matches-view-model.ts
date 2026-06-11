import type {
  MatchData,
  MatchStats,
  PredictionData,
} from '@/lib/matches-service';
import {
  formatLongDatePtBr,
  formatRelativeWindowPtBr,
  formatStagePtBr,
} from '@/lib/pt-br-format';

export type MatchWindowStatus = 'open' | 'upcoming' | 'locked' | 'live' | 'finished';
export type MatchFilterValue =
  | 'all'
  | 'open'
  | 'unsaved'
  | 'saved'
  | 'upcoming'
  | 'locked'
  | 'live'
  | 'finished'
  | `group:${string}`
  | `stage:${string}`
  | `date:${string}`;

export interface MatchLeagueRules {
  windowHours: number;
  maxEdits: number;
}

export interface MatchViewModel {
  match: MatchData;
  prediction: PredictionData | null;
  stats: MatchStats | null;
  editCount: number;
  reachedLimit: boolean;
  canEdit: boolean;
  isSaved: boolean;
  hasPrediction: boolean;
  windowStatus: MatchWindowStatus;
  windowLabel: string;
  sectionKey: string;
  sectionLabel: string;
  stageLabel: string;
  contextLabel: string;
}

export interface MatchSummaryCounts {
  total: number;
  open: number;
  unsaved: number;
  saved: number;
  upcoming: number;
  locked: number;
  live: number;
  finished: number;
}

export interface MatchFilterOption {
  value: MatchFilterValue;
  label: string;
  count: number;
}

export interface MatchSection {
  key: string;
  label: string;
  matches: MatchViewModel[];
}

function isWorldCupGroup(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-L]$/.test(value));
}

export function createPredictionMap(predictions: PredictionData[]) {
  return new Map(predictions.map((prediction) => [prediction.matchId, prediction]));
}

export function getMatchWindowState(
  match: MatchData,
  rules: MatchLeagueRules,
  prediction: PredictionData | null,
  now = Date.now(),
): Pick<
  MatchViewModel,
  'canEdit' | 'reachedLimit' | 'windowLabel' | 'windowStatus'
> {
  const editCount = prediction?.editCount ?? 0;
  const reachedLimit = Boolean(prediction && editCount >= rules.maxEdits);

  if (match.status === 'finished') {
    return {
      canEdit: false,
      reachedLimit,
      windowStatus: 'finished',
      windowLabel: 'Partida encerrada',
    };
  }

  if (match.status !== 'scheduled') {
    return {
      canEdit: false,
      reachedLimit,
      windowStatus: 'live',
      windowLabel: 'Partida em andamento',
    };
  }

  const kickOff = new Date(match.kickOff).getTime();
  const openTime = kickOff - rules.windowHours * 60 * 60_000;
  const limitTime = kickOff - 30 * 60_000;

  if (now < openTime) {
    return {
      canEdit: false,
      reachedLimit,
      windowStatus: 'upcoming',
      windowLabel: `Abre em ${formatRelativeWindowPtBr(openTime, now)}`,
    };
  }

  if (now > limitTime) {
    return {
      canEdit: false,
      reachedLimit,
      windowStatus: 'locked',
      windowLabel: 'Palpites fechados',
    };
  }

  if (reachedLimit) {
    return {
      canEdit: false,
      reachedLimit,
      windowStatus: 'locked',
      windowLabel: 'Limite de edicoes atingido',
    };
  }

  return {
    canEdit: true,
    reachedLimit,
    windowStatus: 'open',
    windowLabel: `Fecha em ${formatRelativeWindowPtBr(limitTime, now)}`,
  };
}

export function getMatchDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function buildMatchViewModels(input: {
  matches: MatchData[];
  predictions: PredictionData[];
  stats: Record<string, MatchStats>;
  rules: MatchLeagueRules;
  now?: number;
}): MatchViewModel[] {
  const predictionMap = createPredictionMap(input.predictions);
  const now = input.now ?? Date.now();

  return input.matches
    .map((match) => {
      const prediction = predictionMap.get(match.id) ?? null;
      const windowState = getMatchWindowState(match, input.rules, prediction, now);
      const stageLabel = formatStagePtBr(match.stage);
      const sectionKey = getMatchDateKey(match.kickOff);
      const contextLabel = isWorldCupGroup(match.group) ? `Grupo ${match.group}` : stageLabel;

      return {
        match,
        prediction,
        stats: input.stats[match.id] ?? null,
        editCount: prediction?.editCount ?? 0,
        isSaved: Boolean(prediction),
        hasPrediction: Boolean(prediction),
        sectionKey,
        sectionLabel: formatLongDatePtBr(match.kickOff),
        stageLabel,
        contextLabel,
        ...windowState,
      };
    })
    .sort(
      (left, right) =>
        new Date(left.match.kickOff).getTime() - new Date(right.match.kickOff).getTime(),
    );
}

export function getMatchSummaryCounts(viewModels: MatchViewModel[]): MatchSummaryCounts {
  return viewModels.reduce<MatchSummaryCounts>(
    (counts, item) => {
      counts.total += 1;
      if (item.canEdit) counts.open += 1;
      if (!item.hasPrediction) counts.unsaved += 1;
      if (item.hasPrediction) counts.saved += 1;
      if (item.windowStatus === 'upcoming') counts.upcoming += 1;
      if (item.windowStatus === 'locked') counts.locked += 1;
      if (item.windowStatus === 'live') counts.live += 1;
      if (item.windowStatus === 'finished') counts.finished += 1;
      return counts;
    },
    {
      total: 0,
      open: 0,
      unsaved: 0,
      saved: 0,
      upcoming: 0,
      locked: 0,
      live: 0,
      finished: 0,
    },
  );
}

export function buildMatchFilterOptions(
  viewModels: MatchViewModel[],
  counts = getMatchSummaryCounts(viewModels),
): MatchFilterOption[] {
  const base: MatchFilterOption[] = [
    { value: 'all', label: 'Todos', count: counts.total },
    { value: 'open', label: 'Abertos', count: counts.open },
    { value: 'unsaved', label: 'Sem palpite', count: counts.unsaved },
    { value: 'saved', label: 'Salvos', count: counts.saved },
    { value: 'upcoming', label: 'Em breve', count: counts.upcoming },
    { value: 'locked', label: 'Bloqueados', count: counts.locked },
    { value: 'live', label: 'Ao vivo', count: counts.live },
    { value: 'finished', label: 'Encerrados', count: counts.finished },
  ];

  const groups = [...new Set(viewModels.map((item) => item.match.group).filter(isWorldCupGroup))]
    .sort()
    .map((group) => ({
      value: `group:${group}` as const,
      label: `Grupo ${group}`,
      count: viewModels.filter((item) => item.match.group === group).length,
    }));

  const stages = [...new Set(viewModels.map((item) => item.match.stage).filter(Boolean))]
    .filter((stage) => stage !== 'group')
    .sort()
    .map((stage) => ({
      value: `stage:${stage}` as const,
      label: formatStagePtBr(stage),
      count: viewModels.filter((item) => item.match.stage === stage).length,
    }));

  const dates = [...new Set(viewModels.map((item) => item.sectionKey))].map((dateKey) => {
    const sample = viewModels.find((item) => item.sectionKey === dateKey);
    return {
      value: `date:${dateKey}` as const,
      label: sample?.sectionLabel ?? dateKey,
      count: viewModels.filter((item) => item.sectionKey === dateKey).length,
    };
  });

  return [...base, ...groups, ...stages, ...dates].filter((option) => option.count > 0);
}

export function filterMatchViewModels(
  viewModels: MatchViewModel[],
  filter: MatchFilterValue,
) {
  if (filter === 'all') return viewModels;
  if (filter === 'open') return viewModels.filter((item) => item.canEdit);
  if (filter === 'unsaved') return viewModels.filter((item) => !item.hasPrediction);
  if (filter === 'saved') return viewModels.filter((item) => item.hasPrediction);
  if (filter === 'upcoming') {
    return viewModels.filter((item) => item.windowStatus === 'upcoming');
  }
  if (filter === 'locked') return viewModels.filter((item) => item.windowStatus === 'locked');
  if (filter === 'live') return viewModels.filter((item) => item.windowStatus === 'live');
  if (filter === 'finished') {
    return viewModels.filter((item) => item.windowStatus === 'finished');
  }
  if (filter.startsWith('group:')) {
    return viewModels.filter((item) => item.match.group === filter.slice('group:'.length));
  }
  if (filter.startsWith('stage:')) {
    return viewModels.filter((item) => item.match.stage === filter.slice('stage:'.length));
  }
  if (filter.startsWith('date:')) {
    return viewModels.filter((item) => item.sectionKey === filter.slice('date:'.length));
  }
  return viewModels;
}

export function groupMatchViewModels(viewModels: MatchViewModel[]): MatchSection[] {
  const sections = new Map<string, MatchSection>();
  for (const item of viewModels) {
    if (!sections.has(item.sectionKey)) {
      sections.set(item.sectionKey, {
        key: item.sectionKey,
        label: item.sectionLabel,
        matches: [],
      });
    }
    sections.get(item.sectionKey)?.matches.push(item);
  }
  return [...sections.values()];
}
