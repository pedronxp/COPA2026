// src/lib/mockData.ts

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
  points: number;
  streak: number; // Quantidade de acertos seguidos (para o foguinho 🔥)
  misses: number; // Quantidade de erros seguidos (para o dedinho 👎)
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickOff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
  result: '1' | 'X' | '2' | null;
  stage: string;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeGuess: number;
  awayGuess: number;
  guess: '1' | 'X' | '2';
  processed: boolean;
}

// Usuários mocados para ranking e zoeira
export const initialMockUsers: UserProfile[] = [
  { id: 'user-1', name: 'Casimiro Miguel', email: 'caze@bolao.com', image: '🔥', points: 28, streak: 4, misses: 0 },
  { id: 'user-2', name: 'Neymar Jr', email: 'ney@bolao.com', image: '⚽', points: 23, streak: 2, misses: 0 },
  { id: 'user-3', name: 'Galvão Bueno', email: 'galvao@bolao.com', image: '🎙️', points: 19, streak: 0, misses: 3 },
  { id: 'user-4', name: 'Luva de Pedreiro', email: 'luva@bolao.com', image: '🧤', points: 12, streak: 0, misses: 5 },
  { id: 'currentUser', name: 'Você (Torcedor)', email: 'usuario@copa.com', image: '👑', points: 15, streak: 1, misses: 0 }
];

// Partidas iniciais da Copa de 2026 (11 a 13 de Junho)
export const initialMockMatches: Match[] = [
  {
    id: 'match-1',
    homeTeam: 'México',
    awayTeam: 'Nova Zelândia',
    homeFlag: '🇲🇽',
    awayFlag: '🇳🇿',
    kickOff: '2026-06-11T19:00:00-06:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  },
  {
    id: 'match-2',
    homeTeam: 'Estados Unidos',
    awayTeam: 'Marrocos',
    homeFlag: '🇺🇸',
    awayFlag: '🇲🇦',
    kickOff: '2026-06-11T18:00:00-07:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  },
  {
    id: 'match-3',
    homeTeam: 'Canadá',
    awayTeam: 'Argélia',
    homeFlag: '🇨🇦',
    awayFlag: '🇩🇿',
    kickOff: '2026-06-12T20:00:00-04:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  },
  {
    id: 'match-4',
    homeTeam: 'Brasil',
    awayTeam: 'Croácia',
    homeFlag: '🇧🇷',
    awayFlag: '🇭🇷',
    kickOff: '2026-06-12T16:00:00-04:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  },
  {
    id: 'match-5',
    homeTeam: 'Argentina',
    awayTeam: 'Arábia Saudita',
    homeFlag: '🇦🇷',
    awayFlag: '🇸🇦',
    kickOff: '2026-06-13T13:00:00-04:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  },
  {
    id: 'match-6',
    homeTeam: 'França',
    awayTeam: 'Austrália',
    homeFlag: '🇫🇷',
    awayFlag: '🇦🇺',
    kickOff: '2026-06-13T18:00:00-04:00',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    result: null,
    stage: 'group'
  }
];

// Palpites aleatórios pré-definidos para os bots
export const initialMockPredictions: Prediction[] = [
  // Caze palpites
  { id: 'p-1', userId: 'user-1', matchId: 'match-1', homeGuess: 2, awayGuess: 0, guess: '1', processed: false },
  { id: 'p-2', userId: 'user-1', matchId: 'match-2', homeGuess: 1, awayGuess: 1, guess: 'X', processed: false },
  { id: 'p-3', userId: 'user-1', matchId: 'match-4', homeGuess: 3, awayGuess: 1, guess: '1', processed: false },
  
  // Neymar palpites
  { id: 'p-4', userId: 'user-2', matchId: 'match-1', homeGuess: 1, awayGuess: 1, guess: 'X', processed: false },
  { id: 'p-5', userId: 'user-2', matchId: 'match-4', homeGuess: 4, awayGuess: 0, guess: '1', processed: false },
  
  // Galvão palpites
  { id: 'p-6', userId: 'user-3', matchId: 'match-1', homeGuess: 3, awayGuess: 0, guess: '1', processed: false },
  { id: 'p-7', userId: 'user-3', matchId: 'match-4', homeGuess: 2, awayGuess: 0, guess: '1', processed: false },
  
  // Luva palpites
  { id: 'p-8', userId: 'user-4', matchId: 'match-4', homeGuess: 1, awayGuess: 2, guess: '2', processed: false }
];
