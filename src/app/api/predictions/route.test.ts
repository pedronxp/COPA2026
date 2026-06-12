import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireApiUserMock = vi.fn();
const getPredictionsMock = vi.fn();
const saveLeaguePredictionMock = vi.fn();

vi.mock('@/lib/api-session', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/matches-service', () => ({
  getPredictions: getPredictionsMock,
}));

vi.mock('@/lib/prediction-service', () => ({
  saveLeaguePrediction: saveLeaguePredictionMock,
}));

function request(body: unknown) {
  return new Request('http://localhost/api/predictions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue({
      user: { id: 'user-1' },
      response: null,
    });
    saveLeaguePredictionMock.mockResolvedValue({
      id: 'prediction-1',
      matchId: 'match-1',
      leagueId: 'global',
      homeGuess: 2,
      awayGuess: 1,
      resultPick: 'draw',
      totalGoalsPick: 'under_1_5',
      bothTeamsScorePick: 'no',
      editCount: 0,
      processed: false,
    });
  });

  it('passes complete independent market picks to the service', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      request({
        matchId: 'match-1',
        homeGuess: 2,
        awayGuess: 1,
        resultPick: 'draw',
        totalGoalsPick: 'under_1_5',
        bothTeamsScorePick: 'no',
        leagueId: 'league-1',
      }),
    );

    expect(response.status).toBe(200);
    expect(saveLeaguePredictionMock).toHaveBeenCalledWith({
      userId: 'user-1',
      matchId: 'match-1',
      homeGuess: 2,
      awayGuess: 1,
      resultPick: 'draw',
      totalGoalsPick: 'under_1_5',
      bothTeamsScorePick: 'no',
      leagueId: 'league-1',
    });
  });

  it('rejects incomplete market payloads before saving', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      request({
        matchId: 'match-1',
        homeGuess: 2,
        awayGuess: 1,
        resultPick: 'home',
      }),
    );

    expect(response.status).toBe(400);
    expect(saveLeaguePredictionMock).not.toHaveBeenCalled();
  });

  it('returns validation errors for unsupported total-goals values', async () => {
    saveLeaguePredictionMock.mockRejectedValueOnce(
      new Error('Escolha uma opcao valida de total de gols.'),
    );
    const { POST } = await import('./route');

    const response = await POST(
      request({
        matchId: 'match-1',
        homeGuess: 2,
        awayGuess: 1,
        resultPick: 'home',
        totalGoalsPick: 'over_6_5',
        bothTeamsScorePick: 'yes',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/total de gols/i);
  });
});
