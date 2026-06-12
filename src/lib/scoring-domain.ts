import {
  deriveBothTeamsScorePick,
  deriveResultPick,
  deriveTotalGoalsPick,
  isTotalGoalsPickCorrect,
  type BothTeamsScorePick,
  type ResultPick,
  type TotalGoalsPick,
} from './prediction-markets';

export interface LeagueScoreRules {
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome?: number;
  pointsWinnerAway?: number;
  pointsDraw: number;
  pointsBothScoreYes?: number;
  pointsBothScoreNo?: number;
}

export interface PredictionMarketScoreInput {
  resultPick?: ResultPick | null;
  totalGoalsPick?: TotalGoalsPick | null;
  bothTeamsScorePick?: BothTeamsScorePick | null;
}

export interface PredictionScoreBreakdown {
  total: number;
  exactScore: number;
  result: number;
  resultKind: ResultPick | 'miss';
  totalGoals: number;
  totalGoalsKind: TotalGoalsPick | 'miss';
  bothTeamsScore: number;
  bothTeamsScoreKind: 'yes' | 'no' | 'miss';
  exact: boolean;
  base: number;
  baseKind: 'exact' | 'total-goals' | 'home' | 'draw' | 'away' | 'none';
}

export function calculatePredictionScore(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
  rules?: LeagueScoreRules,
  markets?: PredictionMarketScoreInput,
): PredictionScoreBreakdown {
  const pointsWinner = rules?.pointsWinner ?? 2;
  const pointsWinnerHome = rules?.pointsWinnerHome ?? pointsWinner;
  const pointsWinnerAway = rules?.pointsWinnerAway ?? pointsWinner;
  const pointsTotalGoals = rules?.pointsDiff ?? 3;
  const resultPick = markets?.resultPick ?? deriveResultPick(homeGuess, awayGuess);
  const totalGoalsPick = markets?.totalGoalsPick ?? deriveTotalGoalsPick(homeGuess, awayGuess);
  const bothTeamsScorePick =
    markets?.bothTeamsScorePick ?? deriveBothTeamsScorePick(homeGuess, awayGuess);
  const realWinner = deriveResultPick(homeScore, awayScore);
  const actualBothScore = deriveBothTeamsScorePick(homeScore, awayScore);
  const actualTotalGoals = homeScore + awayScore;
  const exact = homeGuess === homeScore && awayGuess === awayScore;

  const exactScore = exact ? rules?.pointsExact ?? 5 : 0;
  const result =
    resultPick === realWinner
      ? realWinner === 'home'
        ? pointsWinnerHome
        : realWinner === 'away'
          ? pointsWinnerAway
          : rules?.pointsDraw ?? 2
      : 0;
  const resultKind: PredictionScoreBreakdown['resultKind'] =
    resultPick === realWinner ? resultPick : 'miss';
  const totalGoals = isTotalGoalsPickCorrect(totalGoalsPick, actualTotalGoals)
    ? pointsTotalGoals
    : 0;
  const totalGoalsKind: PredictionScoreBreakdown['totalGoalsKind'] =
    totalGoals > 0 ? totalGoalsPick : 'miss';

  const bothTeamsScoreKind: PredictionScoreBreakdown['bothTeamsScoreKind'] =
    bothTeamsScorePick !== actualBothScore ? 'miss' : actualBothScore;
  const bothTeamsScore =
    bothTeamsScoreKind === 'yes'
      ? rules?.pointsBothScoreYes ?? 0
      : bothTeamsScoreKind === 'no'
        ? rules?.pointsBothScoreNo ?? 0
        : 0;
  const base = exactScore + result + totalGoals;
  const baseKind: PredictionScoreBreakdown['baseKind'] = exact
    ? 'exact'
    : totalGoals > 0
      ? 'total-goals'
      : resultKind === 'home' || resultKind === 'draw' || resultKind === 'away'
        ? resultKind
        : 'none';

  return {
    total: exactScore + result + totalGoals + bothTeamsScore,
    exactScore,
    result,
    resultKind,
    totalGoals,
    totalGoalsKind,
    bothTeamsScore,
    bothTeamsScoreKind,
    exact,
    base,
    baseKind,
  };
}
