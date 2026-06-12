import backupData from './backup-data.json';

const API_BASE = process.env.WORLDCUP_API_BASE || 'https://worldcup26.ir';
const TIMEOUT_MS = 10_000;

export interface ApiGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface ApiTeam {
  name_en: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
  id: string;
}

export interface ApiStadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity?: string;
  lat?: string;
  lng?: string;
}

export interface FootballFetchResult<T> {
  data: T;
  source: 'api' | 'backup';
  error: string | null;
}

export interface FootballSnapshotResult {
  games: ApiGame[];
  teams: ApiTeam[];
  source: 'api' | 'backup';
  error: string | null;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro desconhecido';
}

export function validateGames(games: unknown): ApiGame[] {
  if (!Array.isArray(games) || games.length !== 104) {
    throw new Error(`Games deve conter 104 partidas; recebeu ${Array.isArray(games) ? games.length : 0}.`);
  }

  const ids = new Set<string>();
  for (const game of games) {
    if (!game || typeof game !== 'object') throw new Error('Games contem item invalido.');
    const item = game as Partial<ApiGame>;
    if (!item.id || !/^\d+$/.test(item.id) || ids.has(item.id)) {
      throw new Error(`Game com ID invalido ou duplicado: ${item.id || 'ausente'}.`);
    }
    if (!item.local_date || !/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(item.local_date)) {
      throw new Error(`Game ${item.id} possui data invalida.`);
    }
    if (!item.stadium_id || !item.finished || !item.time_elapsed || !item.type) {
      throw new Error(`Game ${item.id} possui campos obrigatorios ausentes.`);
    }
    ids.add(item.id);
  }
  return games as ApiGame[];
}

export function validateTeams(teams: unknown): ApiTeam[] {
  if (!Array.isArray(teams) || teams.length !== 48) {
    throw new Error(`Teams deve conter 48 selecoes; recebeu ${Array.isArray(teams) ? teams.length : 0}.`);
  }

  const ids = new Set<string>();
  for (const team of teams) {
    if (!team || typeof team !== 'object') throw new Error('Teams contem item invalido.');
    const item = team as Partial<ApiTeam>;
    if (!item.id || !/^\d+$/.test(item.id) || ids.has(item.id) || !item.name_en) {
      throw new Error(`Team com ID ou nome invalido: ${item.id || 'ausente'}.`);
    }
    ids.add(item.id);
  }
  return teams as ApiTeam[];
}

async function fetchPayload(path: string, key: 'games' | 'teams') {
  const response = await fetchWithTimeout(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`${key} respondeu HTTP ${response.status}.`);
  const payload = await response.json();
  if (!payload || typeof payload !== 'object') throw new Error(`${key} retornou payload invalido.`);
  return (payload as Record<string, unknown>)[key];
}

export async function fetchFootballSnapshot(): Promise<FootballSnapshotResult> {
  const [gamesResult, teamsResult] = await Promise.allSettled([
    fetchPayload('/get/games', 'games').then(validateGames),
    fetchPayload('/get/teams', 'teams').then(validateTeams),
  ]);

  if (gamesResult.status === 'fulfilled' && teamsResult.status === 'fulfilled') {
    return {
      games: gamesResult.value,
      teams: teamsResult.value,
      source: 'api',
      error: null,
    };
  }

  const errors = [
    gamesResult.status === 'rejected' ? `Games: ${errorMessage(gamesResult.reason)}` : null,
    teamsResult.status === 'rejected' ? `Teams: ${errorMessage(teamsResult.reason)}` : null,
  ].filter(Boolean);

  return {
    games: validateGames(backupData.games),
    teams: validateTeams(backupData.teams),
    source: 'backup',
    error: errors.join(' '),
  };
}

export async function fetchGamesResult(): Promise<FootballFetchResult<ApiGame[]>> {
  const result = await fetchFootballSnapshot();
  return { data: result.games, source: result.source, error: result.error };
}

export async function fetchTeamsResult(): Promise<FootballFetchResult<ApiTeam[]>> {
  const result = await fetchFootballSnapshot();
  return { data: result.teams, source: result.source, error: result.error };
}

export async function fetchGames(): Promise<ApiGame[]> {
  return (await fetchGamesResult()).data;
}

export async function fetchTeams(): Promise<ApiTeam[]> {
  return (await fetchTeamsResult()).data;
}

export async function fetchStadiums(): Promise<ApiStadium[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/stadiums`);
    if (!response.ok) return [];
    const payload = await response.json();
    return payload.stadiums ?? [];
  } catch {
    return [];
  }
}
