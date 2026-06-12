export const RESULT_PICKS = ['home', 'draw', 'away'] as const;
export const BOTH_TEAMS_SCORE_PICKS = ['yes', 'no'] as const;
export const TOTAL_GOALS_PICKS = [
  'over_1_5',
  'over_2_5',
  'over_3_5',
  'over_4_5',
  'over_5_5_plus',
  'under_1_5',
  'under_2_5',
  'under_3_5',
  'under_4_5',
  'under_5_5',
] as const;

export type ResultPick = (typeof RESULT_PICKS)[number];
export type BothTeamsScorePick = (typeof BOTH_TEAMS_SCORE_PICKS)[number];
export type TotalGoalsPick = (typeof TOTAL_GOALS_PICKS)[number];

export interface PredictionMarketPicks {
  resultPick: ResultPick;
  totalGoalsPick: TotalGoalsPick;
  bothTeamsScorePick: BothTeamsScorePick;
}

export const TOTAL_GOALS_OPTIONS: Array<{
  value: TotalGoalsPick;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  { value: 'over_1_5', label: 'Over 1.5', shortLabel: 'Over 1.5', description: '2+ gols' },
  { value: 'over_2_5', label: 'Over 2.5', shortLabel: 'Over 2.5', description: '3+ gols' },
  { value: 'over_3_5', label: 'Over 3.5', shortLabel: 'Over 3.5', description: '4+ gols' },
  { value: 'over_4_5', label: 'Over 4.5', shortLabel: 'Over 4.5', description: '5+ gols' },
  {
    value: 'over_5_5_plus',
    label: 'Over 5.5+',
    shortLabel: 'Over 5.5+',
    description: '6+ gols',
  },
  { value: 'under_1_5', label: 'Under 1.5', shortLabel: 'Under 1.5', description: '0-1 gol' },
  { value: 'under_2_5', label: 'Under 2.5', shortLabel: 'Under 2.5', description: '0-2 gols' },
  { value: 'under_3_5', label: 'Under 3.5', shortLabel: 'Under 3.5', description: '0-3 gols' },
  { value: 'under_4_5', label: 'Under 4.5', shortLabel: 'Under 4.5', description: '0-4 gols' },
  { value: 'under_5_5', label: 'Under 5.5', shortLabel: 'Under 5.5', description: '0-5 gols' },
];

export const RESULT_PICK_LABELS: Record<ResultPick, string> = {
  home: 'Casa vence',
  draw: 'Empate',
  away: 'Fora vence',
};

export const BOTH_TEAMS_SCORE_LABELS: Record<BothTeamsScorePick, string> = {
  yes: 'Sim',
  no: 'Não',
};

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value);
}

export function isResultPick(value: unknown): value is ResultPick {
  return isOneOf(value, RESULT_PICKS);
}

export function isTotalGoalsPick(value: unknown): value is TotalGoalsPick {
  return isOneOf(value, TOTAL_GOALS_PICKS);
}

export function isBothTeamsScorePick(value: unknown): value is BothTeamsScorePick {
  return isOneOf(value, BOTH_TEAMS_SCORE_PICKS);
}

export function parsePredictionMarketPicks(input: {
  resultPick?: unknown;
  totalGoalsPick?: unknown;
  bothTeamsScorePick?: unknown;
}): PredictionMarketPicks {
  if (!isResultPick(input.resultPick)) {
    throw new Error('Escolha o resultado: casa vence, empate ou fora vence.');
  }
  if (!isTotalGoalsPick(input.totalGoalsPick)) {
    throw new Error('Escolha uma opção válida de total de gols.');
  }
  if (!isBothTeamsScorePick(input.bothTeamsScorePick)) {
    throw new Error('Escolha se ambas marcam: sim ou não.');
  }

  return {
    resultPick: input.resultPick,
    totalGoalsPick: input.totalGoalsPick,
    bothTeamsScorePick: input.bothTeamsScorePick,
  };
}

export function deriveResultPick(home: number, away: number): ResultPick {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

export function deriveBothTeamsScorePick(home: number, away: number): BothTeamsScorePick {
  return home > 0 && away > 0 ? 'yes' : 'no';
}

export function deriveTotalGoalsPick(home: number, away: number): TotalGoalsPick {
  const total = home + away;
  if (total >= 6) return 'over_5_5_plus';
  if (total >= 5) return 'over_4_5';
  if (total >= 4) return 'over_3_5';
  if (total >= 3) return 'over_2_5';
  if (total >= 2) return 'over_1_5';
  return 'under_1_5';
}

export function normalizePredictionMarketPicks(input: {
  homeGuess: number;
  awayGuess: number;
  resultPick?: string | null;
  totalGoalsPick?: string | null;
  bothTeamsScorePick?: string | null;
}): PredictionMarketPicks {
  return {
    resultPick: isResultPick(input.resultPick)
      ? input.resultPick
      : deriveResultPick(input.homeGuess, input.awayGuess),
    totalGoalsPick: isTotalGoalsPick(input.totalGoalsPick)
      ? input.totalGoalsPick
      : deriveTotalGoalsPick(input.homeGuess, input.awayGuess),
    bothTeamsScorePick: isBothTeamsScorePick(input.bothTeamsScorePick)
      ? input.bothTeamsScorePick
      : deriveBothTeamsScorePick(input.homeGuess, input.awayGuess),
  };
}

export function isTotalGoalsPickCorrect(pick: TotalGoalsPick, totalGoals: number) {
  switch (pick) {
    case 'over_1_5':
      return totalGoals >= 2;
    case 'over_2_5':
      return totalGoals >= 3;
    case 'over_3_5':
      return totalGoals >= 4;
    case 'over_4_5':
      return totalGoals >= 5;
    case 'over_5_5_plus':
      return totalGoals >= 6;
    case 'under_1_5':
      return totalGoals <= 1;
    case 'under_2_5':
      return totalGoals <= 2;
    case 'under_3_5':
      return totalGoals <= 3;
    case 'under_4_5':
      return totalGoals <= 4;
    case 'under_5_5':
      return totalGoals <= 5;
  }
}

export function formatTotalGoalsPick(pick: TotalGoalsPick | string | null | undefined) {
  const option = TOTAL_GOALS_OPTIONS.find((item) => item.value === pick);
  return option ? `${option.label} (${option.description})` : 'Total não informado';
}

export function formatResultPick(pick: ResultPick | string | null | undefined) {
  return isResultPick(pick) ? RESULT_PICK_LABELS[pick] : 'Resultado não informado';
}

export function formatBothTeamsScorePick(
  pick: BothTeamsScorePick | string | null | undefined,
) {
  return isBothTeamsScorePick(pick) ? BOTH_TEAMS_SCORE_LABELS[pick] : 'Ambas não informado';
}
