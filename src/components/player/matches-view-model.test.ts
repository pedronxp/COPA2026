import { describe, expect, it } from 'vitest';
import type { MatchData, MatchStats, PredictionData } from '@/lib/matches-service';
import {
  buildMatchFilterOptions,
  buildMatchViewModels,
  filterMatchViewModels,
  getMatchSummaryCounts,
  getMatchWindowState,
  groupMatchViewModels,
} from './matches-view-model';

const now = new Date('2026-06-10T12:00:00.000Z').getTime();
const rules = { windowHours: 48, maxEdits: 3 };

function match(overrides: Partial<MatchData>): MatchData {
  return {
    id: overrides.id ?? 'match-1',
    externalId: null,
    homeTeam: 'Brasil',
    awayTeam: 'Japao',
    homeFlag: 'BR',
    awayFlag: 'JP',
    homeTeamLogo: null,
    awayTeamLogo: null,
    homeLabel: null,
    awayLabel: null,
    kickOff: overrides.kickOff ?? '2026-06-11T12:00:00.000Z',
    homeScore: null,
    awayScore: null,
    status: overrides.status ?? 'scheduled',
    stage: overrides.stage ?? 'group',
    matchday: null,
    group: overrides.group ?? 'A',
    elapsed: null,
    predictionCount: 0,
  };
}

function prediction(overrides: Partial<PredictionData>): PredictionData {
  return {
    id: overrides.id ?? 'prediction-1',
    userId: 'user-1',
    matchId: overrides.matchId ?? 'match-1',
    leagueId: 'global',
    homeGuess: overrides.homeGuess ?? 1,
    awayGuess: overrides.awayGuess ?? 0,
    resultPick: overrides.resultPick ?? 'home',
    totalGoalsPick: overrides.totalGoalsPick ?? 'over_1_5',
    bothTeamsScorePick: overrides.bothTeamsScorePick ?? 'no',
    editCount: overrides.editCount ?? 0,
    processed: false,
  };
}

const stats: Record<string, MatchStats> = {
  'match-1': { home: 50, draw: 20, away: 30, total: 10 },
};

describe('matches view model', () => {
  it('marks a scheduled match inside the window as editable', () => {
    const state = getMatchWindowState(
      match({ kickOff: '2026-06-11T12:00:00.000Z' }),
      rules,
      null,
      now,
    );

    expect(state.windowStatus).toBe('open');
    expect(state.canEdit).toBe(true);
  });

  it('marks a scheduled match before the window as upcoming', () => {
    const state = getMatchWindowState(
      match({ kickOff: '2026-06-15T12:00:00.000Z' }),
      rules,
      null,
      now,
    );

    expect(state.windowStatus).toBe('upcoming');
    expect(state.canEdit).toBe(false);
  });

  it('locks a match when the edit limit has been reached', () => {
    const state = getMatchWindowState(
      match({ kickOff: '2026-06-11T12:00:00.000Z' }),
      rules,
      prediction({ editCount: 3 }),
      now,
    );

    expect(state.windowStatus).toBe('locked');
    expect(state.reachedLimit).toBe(true);
    expect(state.canEdit).toBe(false);
  });

  it('derives counts, filter options, and grouped sections', () => {
    const viewModels = buildMatchViewModels({
      matches: [
        match({ id: 'match-1', kickOff: '2026-06-11T12:00:00.000Z', group: 'A' }),
        match({
          id: 'match-2',
          kickOff: '2026-06-15T12:00:00.000Z',
          group: 'B',
        }),
        match({
          id: 'match-3',
          kickOff: '2026-06-12T12:00:00.000Z',
          group: null,
          stage: 'r16',
          status: 'finished',
        }),
      ],
      predictions: [prediction({ matchId: 'match-1' })],
      stats,
      rules,
      now,
    });

    expect(getMatchSummaryCounts(viewModels)).toMatchObject({
      total: 3,
      open: 1,
      saved: 1,
      unsaved: 2,
      upcoming: 1,
      finished: 1,
    });
    expect(buildMatchFilterOptions(viewModels).map((option) => option.value)).toContain(
      'stage:r16',
    );
    expect(filterMatchViewModels(viewModels, 'unsaved')).toHaveLength(2);
    expect(groupMatchViewModels(viewModels)).toHaveLength(3);
  });
});
