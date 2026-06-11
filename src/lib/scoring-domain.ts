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

export interface PredictionScoreBreakdown {
  total: number;
  base: number;
  baseKind: 'exact' | 'difference' | 'home' | 'draw' | 'away' | 'none';
  bothTeamsScore: number;
  bothTeamsScoreKind: 'yes' | 'no' | 'miss';
  exact: boolean;
}

export function calculatePredictionScore(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
  rules?: LeagueScoreRules,
): PredictionScoreBreakdown {
  const pointsWinner = rules?.pointsWinner ?? 2;
  const pointsWinnerHome = rules?.pointsWinnerHome ?? pointsWinner;
  const pointsWinnerAway = rules?.pointsWinnerAway ?? pointsWinner;
  const guessWinner = homeGuess > awayGuess ? '1' : homeGuess < awayGuess ? '2' : 'X';
  const realWinner = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
  const exact = homeGuess === homeScore && awayGuess === awayScore;

  let base = 0;
  let baseKind: PredictionScoreBreakdown['baseKind'] = 'none';

  if (exact) {
    base = rules?.pointsExact ?? 5;
    baseKind = 'exact';
  } else if (guessWinner === realWinner) {
    if (realWinner === 'X') {
      base = rules?.pointsDraw ?? 2;
      baseKind = 'draw';
    } else if (homeGuess - awayGuess === homeScore - awayScore) {
      base = rules?.pointsDiff ?? 3;
      baseKind = 'difference';
    } else if (realWinner === '1') {
      base = pointsWinnerHome;
      baseKind = 'home';
    } else {
      base = pointsWinnerAway;
      baseKind = 'away';
    }
  }

  const guessedBothScore = homeGuess > 0 && awayGuess > 0;
  const actualBothScore = homeScore > 0 && awayScore > 0;
  const bothTeamsScoreKind: PredictionScoreBreakdown['bothTeamsScoreKind'] =
    guessedBothScore !== actualBothScore ? 'miss' : actualBothScore ? 'yes' : 'no';
  const bothTeamsScore =
    bothTeamsScoreKind === 'yes'
      ? rules?.pointsBothScoreYes ?? 0
      : bothTeamsScoreKind === 'no'
        ? rules?.pointsBothScoreNo ?? 0
        : 0;

  return {
    total: base + bothTeamsScore,
    base,
    baseKind,
    bothTeamsScore,
    bothTeamsScoreKind,
    exact,
  };
}
