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

export async function fetchGamesResult(): Promise<FootballFetchResult<ApiGame[]>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/games`);
    if (!response.ok) {
      return {
        data: backupData.games as ApiGame[],
        source: 'backup',
        error: `Games respondeu HTTP ${response.status}.`,
      };
    }

    const payload = await response.json();
    if (payload && Array.isArray(payload.games) && payload.games.length > 0) {
      return { data: payload.games, source: 'api', error: null };
    }

    return {
      data: backupData.games as ApiGame[],
      source: 'backup',
      error: 'Games retornou uma lista vazia ou invalida.',
    };
  } catch (error) {
    return {
      data: backupData.games as ApiGame[],
      source: 'backup',
      error: `Falha de rede em games: ${errorMessage(error)}`,
    };
  }
}

export async function fetchTeamsResult(): Promise<FootballFetchResult<ApiTeam[]>> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/teams`);
    if (!response.ok) {
      return {
        data: backupData.teams as ApiTeam[],
        source: 'backup',
        error: `Teams respondeu HTTP ${response.status}.`,
      };
    }

    const payload = await response.json();
    if (payload && Array.isArray(payload.teams) && payload.teams.length > 0) {
      return { data: payload.teams, source: 'api', error: null };
    }

    return {
      data: backupData.teams as ApiTeam[],
      source: 'backup',
      error: 'Teams retornou uma lista vazia ou invalida.',
    };
  } catch (error) {
    return {
      data: backupData.teams as ApiTeam[],
      source: 'backup',
      error: `Falha de rede em teams: ${errorMessage(error)}`,
    };
  }
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
