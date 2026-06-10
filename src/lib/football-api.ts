// src/lib/football-api.ts
// Cliente HTTP para a API WorldCup26.ir (dados abertos da Copa do Mundo 2026)
import backupData from './backup-data.json';

const API_BASE = process.env.WORLDCUP_API_BASE || 'https://worldcup26.ir';
const TIMEOUT_MS = 10_000;

// ─── Tipos da API Externa ────────────────────────────────────────────

export interface ApiGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;        // Formato: "MM/DD/YYYY HH:mm"
  stadium_id: string;
  finished: string;           // "TRUE" | "FALSE"
  time_elapsed: string;       // "notstarted" | "45" | "halftime" | "finished" etc.
  type: string;               // "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final"
  home_team_name_en: string;
  away_team_name_en: string;
  home_team_label?: string;   // Para eliminatórias: ex "Winner Match 73"
  away_team_label?: string;   // Para eliminatórias: ex "Runner-up Group A"
}

export interface ApiTeam {
  name_en: string;
  flag: string;               // URL da bandeira: "https://flagcdn.com/w80/mx.png"
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

// ─── Funções de Fetch ────────────────────────────────────────────────

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Busca todas as partidas da Copa do Mundo 2026.
 * GET https://worldcup26.ir/get/games
 */
export async function fetchGames(): Promise<ApiGame[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/games`);
    if (!response.ok) {
      console.warn(`[football-api] Erro ao buscar games (HTTP ${response.status}). Usando backup local.`);
      return backupData.games as ApiGame[];
    }
    const data = await response.json();
    if (data && Array.isArray(data.games) && data.games.length > 0) {
      return data.games;
    }
    console.warn('[football-api] API retornou lista de jogos vazia ou inválida. Usando backup local.');
    return backupData.games as ApiGame[];
  } catch (error) {
    console.error('[football-api] Erro de rede ao buscar games. Usando backup local:', error);
    return backupData.games as ApiGame[];
  }
}

/**
 * Busca todos os times participantes da Copa.
 * GET https://worldcup26.ir/get/teams
 */
export async function fetchTeams(): Promise<ApiTeam[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/teams`);
    if (!response.ok) {
      console.warn(`[football-api] Erro ao buscar teams (HTTP ${response.status}). Usando backup local.`);
      return backupData.teams as ApiTeam[];
    }
    const data = await response.json();
    if (data && Array.isArray(data.teams) && data.teams.length > 0) {
      return data.teams;
    }
    console.warn('[football-api] API retornou lista de times vazia ou inválida. Usando backup local.');
    return backupData.teams as ApiTeam[];
  } catch (error) {
    console.error('[football-api] Erro de rede ao buscar teams. Usando backup local:', error);
    return backupData.teams as ApiTeam[];
  }
}

/**
 * Busca todos os estádios da Copa.
 * GET https://worldcup26.ir/get/stadiums
 */
export async function fetchStadiums(): Promise<ApiStadium[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/get/stadiums`);
    if (!response.ok) {
      console.error(`[football-api] Erro ao buscar stadiums: HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.stadiums ?? [];
  } catch (error) {
    console.error('[football-api] Erro ao buscar stadiums:', error);
    return [];
  }
}
