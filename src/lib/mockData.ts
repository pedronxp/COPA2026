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

// Inicializa a base apenas com o perfil do próprio usuário para remover os dados falsos
export const initialMockUsers: UserProfile[] = [
  { id: 'currentUser', name: 'Você (Torcedor)', email: 'usuario@copa.com', image: '👑', points: 0, streak: 0, misses: 0 }
];

// Partidas oficiais da Copa de 2026 (fase inicial real)
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

// Inicia os palpites vazios, sem palpites fake de robôs
export const initialMockPredictions: Prediction[] = [];
