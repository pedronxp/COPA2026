// src/lib/matches-service.ts
import { prisma } from './prisma';
import { 
  initialMockMatches, 
  initialMockUsers, 
  initialMockPredictions,
  Match, 
  UserProfile, 
  Prediction 
} from './mockData';

// Estado em memória global para fallback de simulação/demo local
let memoryMatches = [...initialMockMatches];
let memoryUsers = [...initialMockUsers];
let memoryPredictions = [...initialMockPredictions];

// Função auxiliar para verificar se o banco de dados Neon está disponível
function isDbAvailable(): boolean {
  const dbUrl = process.env.DATABASE_URL;
  return !!dbUrl && !dbUrl.includes('seu-host-neon') && !dbUrl.includes('usuario:senha');
}

// Lógica de cálculo de pontos baseada nas regras do Bolão do GE
export function calculatePredictionPoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number
): number {
  const guessWinner = homeGuess > awayGuess ? '1' : homeGuess < awayGuess ? '2' : 'X';
  const realWinner = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';

  // 1. Acerto do Placar Exato (5 pontos)
  if (homeGuess === homeScore && awayGuess === awayScore) {
    return 5;
  }

  // Se errou o placar, mas acertou o vencedor/empate
  if (guessWinner === realWinner) {
    // 2. Acerto de Empate Não Exato (2 pontos)
    if (realWinner === 'X') {
      return 2;
    }

    // 3. Acerto do Vencedor e Saldo/Diferença de Gols (3 pontos)
    const guessDiff = homeGuess - awayGuess;
    const realDiff = homeScore - awayScore;
    if (guessDiff === realDiff) {
      return 3;
    }

    // 4. Acerto de Apenas o Vencedor (2 pontos)
    return 2;
  }

  // 5. Erro Total (0 pontos)
  return 0;
}

export async function getMatches(): Promise<Match[]> {
  if (isDbAvailable()) {
    try {
      const dbMatches = await prisma.match.findMany({
        orderBy: { kickOff: 'asc' }
      });
      return dbMatches.map(m => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeFlag: m.homeFlag ?? '🏳️',
        awayFlag: m.awayFlag ?? '🏳️',
        kickOff: m.kickOff.toISOString(),
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status as 'scheduled' | 'live' | 'finished',
        result: m.result as '1' | 'X' | '2' | null,
        stage: m.stage
      }));
    } catch (e) {
      console.warn('Falha ao conectar no Neon. Usando dados mocados na memória.', e);
    }
  }
  return memoryMatches;
}

export async function getUsers(): Promise<UserProfile[]> {
  if (isDbAvailable()) {
    try {
      const dbUsers = await prisma.user.findMany({
        orderBy: { points: 'desc' }
      });
      // Mapear usuários e calcular heurística de streak
      return dbUsers.map((u, index) => ({
        id: u.id,
        name: u.name ?? 'Usuário',
        email: u.email,
        image: u.image ?? '👤',
        points: u.points,
        streak: u.id === 'user-1' ? 4 : u.id === 'user-2' ? 2 : 0, // Mocked streaks
        misses: u.id === 'user-3' ? 3 : u.id === 'user-4' ? 5 : 0
      }));
    } catch (e) {
      // ignore, fallback below
    }
  }
  // Retorna usuários ordenados por pontos
  return [...memoryUsers].sort((a, b) => b.points - a.points);
}

export async function getPredictions(userId: string): Promise<Prediction[]> {
  if (isDbAvailable()) {
    try {
      const dbPreds = await prisma.prediction.findMany({
        where: { userId }
      });
      return dbPreds.map(p => ({
        id: p.id,
        userId: p.userId,
        matchId: p.matchId,
        homeGuess: p.homeGuess,
        awayGuess: p.awayGuess,
        guess: p.guess as '1' | 'X' | '2',
        processed: p.processed
      }));
    } catch (e) {
      // ignore
    }
  }
  return memoryPredictions.filter(p => p.userId === userId);
}

export async function savePrediction(
  userId: string,
  matchId: string,
  homeGuess: number,
  awayGuess: number
): Promise<Prediction> {
  const guess = homeGuess > awayGuess ? '1' : homeGuess < awayGuess ? '2' : 'X';

  // Obter detalhes da partida para o Time Gate
  const matches = await getMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match) throw new Error('Partida não encontrada.');

  // Validar se falta menos de 30 minutos (Time Gate)
  const kickoffTime = new Date(match.kickOff).getTime();
  const limitTime = kickoffTime - 30 * 60 * 1000;
  if (Date.now() > limitTime) {
    throw new Error('Palpites estão fechados para esta partida (limite de 30 minutos antes do jogo).');
  }

  if (isDbAvailable()) {
    try {
      const prediction = await prisma.prediction.upsert({
        where: {
          userId_matchId: { userId, matchId }
        },
        update: { homeGuess, awayGuess, guess },
        create: { userId, matchId, homeGuess, awayGuess, guess }
      });
      return {
        id: prediction.id,
        userId: prediction.userId,
        matchId: prediction.matchId,
        homeGuess: prediction.homeGuess,
        awayGuess: prediction.awayGuess,
        guess: prediction.guess as '1' | 'X' | '2',
        processed: prediction.processed
      };
    } catch (e) {
      console.warn('Erro ao salvar palpite no banco. Salvando em memória local...', e);
    }
  }

  // Fallback em memória
  const existingIndex = memoryPredictions.findIndex(p => p.userId === userId && p.matchId === matchId);
  const newPrediction: Prediction = {
    id: existingIndex >= 0 ? memoryPredictions[existingIndex].id : `p-gen-${Date.now()}`,
    userId,
    matchId,
    homeGuess,
    awayGuess,
    guess,
    processed: false
  };

  if (existingIndex >= 0) {
    memoryPredictions[existingIndex] = newPrediction;
  } else {
    memoryPredictions.push(newPrediction);
  }

  return newPrediction;
}

// Simulador da Copa / Feeder administrativo
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished'
): Promise<Match> {
  const result = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';

  if (isDbAvailable()) {
    try {
      const updated = await prisma.match.update({
        where: { id: matchId },
        data: { homeScore, awayScore, status, result }
      });
      
      // Se finalizado, rodar o Score Engine
      if (status === 'finished') {
        await processScoringForMatch(matchId, homeScore, awayScore);
      }

      return {
        id: updated.id,
        homeTeam: updated.homeTeam,
        awayTeam: updated.awayTeam,
        homeFlag: updated.homeFlag ?? '🏳️',
        awayFlag: updated.awayFlag ?? '🏳️',
        kickOff: updated.kickOff.toISOString(),
        homeScore: updated.homeScore,
        awayScore: updated.awayScore,
        status: updated.status as 'scheduled' | 'live' | 'finished',
        result: updated.result as '1' | 'X' | '2' | null,
        stage: updated.stage
      };
    } catch (e) {
      console.warn('Erro ao atualizar partida no banco Neon. Atualizando em memória.', e);
    }
  }

  // Fallback em memória
  const matchIndex = memoryMatches.findIndex(m => m.id === matchId);
  if (matchIndex < 0) throw new Error('Partida não encontrada.');

  const wasFinished = memoryMatches[matchIndex].status === 'finished';

  const updatedMatch: Match = {
    ...memoryMatches[matchIndex],
    homeScore,
    awayScore,
    status,
    result: status === 'finished' || status === 'live' ? result : null
  };

  memoryMatches[matchIndex] = updatedMatch;

  // Rodar Score Engine na memória
  if (status === 'finished' && !wasFinished) {
    await processScoringForMatchMemory(matchId, homeScore, awayScore);
  }

  return updatedMatch;
}

// Motor de pontuação em Banco Real (Neon)
async function processScoringForMatch(matchId: string, homeScore: number, awayScore: number) {
  const result = homeScore > awayScore ? '1' : homeScore < awayScore ? '2' : 'X';
  
  // Buscar palpites não processados para o jogo
  const predictions = await prisma.prediction.findMany({
    where: { matchId, processed: false }
  });

  for (const pred of predictions) {
    const points = calculatePredictionPoints(pred.homeGuess, pred.awayGuess, homeScore, awayScore);
    
    // Atualizar pontos do usuário se acertou
    if (points > 0) {
      await prisma.user.update({
        where: { id: pred.userId },
        data: { points: { increment: points } }
      });
    }

    // Marcar palpite como processado
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { processed: true }
    });
  }
}

// Motor de pontuação na memória (Fallback)
async function processScoringForMatchMemory(matchId: string, homeScore: number, awayScore: number) {
  const unprocesseds = memoryPredictions.filter(p => p.matchId === matchId && !p.processed);

  for (const pred of unprocesseds) {
    const points = calculatePredictionPoints(pred.homeGuess, pred.awayGuess, homeScore, awayScore);
    
    // Atualizar pontos na memória de usuários
    const userIndex = memoryUsers.findIndex(u => u.id === pred.userId);
    if (userIndex >= 0 && points > 0) {
      memoryUsers[userIndex].points += points;
      
      // Ajustar streaks mocados para zoeira
      if (points === 5) {
        memoryUsers[userIndex].streak += 1;
        memoryUsers[userIndex].misses = 0;
      } else if (points === 0) {
        memoryUsers[userIndex].misses += 1;
        memoryUsers[userIndex].streak = 0;
      }
    }
    
    pred.processed = true;
  }
}

// Função administrativa para resetar partidas de simulação
export async function resetSimulation(): Promise<void> {
  memoryMatches = [...initialMockMatches];
  memoryUsers = [...initialMockUsers];
  memoryPredictions = [...initialMockPredictions];
}

// Criar competidor dinâmico na sandbox
export async function createSandboxUser(name: string, image: string): Promise<UserProfile> {
  const email = `${name.toLowerCase().replace(/\s+/g, '')}@bolao.com`;
  const newUser: UserProfile = {
    id: `user-gen-${Date.now()}`,
    name,
    email,
    image,
    points: 0,
    streak: 0,
    misses: 0
  };

  if (isDbAvailable()) {
    try {
      const dbUser = await prisma.user.create({
        data: {
          name,
          email,
          image,
          points: 0
        }
      });
      return {
        id: dbUser.id,
        name: dbUser.name ?? name,
        email: dbUser.email,
        image: dbUser.image ?? image,
        points: dbUser.points,
        streak: 0,
        misses: 0
      };
    } catch (e) {
      console.warn('Falha ao inserir usuário no Neon SQL. Criando na memória...', e);
    }
  }

  memoryUsers.push(newUser);
  return newUser;
}
