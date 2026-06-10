// src/lib/matches-service.ts
// Serviço de dados do bolão - 100% Prisma, sem mock, sem fallback em memória
import { prisma } from './prisma';
import { fetchGames, fetchTeams, type ApiGame, type ApiTeam } from './football-api';

// ─── Tipos Exportados ────────────────────────────────────────────────

export interface MatchData {
  id: string;
  externalId: number | null;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickOff: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  stage: string;
  matchday: string | null;
  group: string | null;
  elapsed: string | null;
  predictionCount?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
  points: number;
  streak: number;
  misses: number;
}

export interface PredictionData {
  id: string;
  userId: string;
  matchId: string;
  homeGuess: number;
  awayGuess: number;
  processed: boolean;
}

export interface MatchStats {
  home: number;
  draw: number;
  away: number;
  total: number;
}

export interface SyncReport {
  created: number;
  updated: number;
  source: string;
}

// ─── Lógica de Pontuação (regras Bolão do GE) ───────────────────────

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

// ─── Funções de Dados (Prisma direto) ────────────────────────────────

/**
 * Garante que o usuário existe no banco de dados para evitar violações de integridade.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    if (userId === 'currentUser') {
      await prisma.user.create({
        data: {
          id: 'currentUser',
          name: 'Você (Torcedor)',
          email: 'usuario@copa.com',
          image: '👑',
          points: 0,
          streak: 0,
          misses: 0,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: userId,
          name: `Competidor ${userId.substring(0, 5)}`,
          email: `${userId}@bolao.com`,
          image: '👤',
          points: 0,
          streak: 0,
          misses: 0,
        },
      });
    }
  }
}

/**
 * Busca partidas do banco com filtro opcional por stage e/ou group.
 */
export async function getMatches(filter?: { stage?: string; group?: string }): Promise<MatchData[]> {
  const where: Record<string, unknown> = {};

  if (filter?.stage) {
    where.stage = filter.stage;
  }
  
  if (filter?.group) {
    // Se o filtro for uma única letra de A a L, filtra pela coluna de grupo
    if (filter.group.length === 1 && filter.group >= 'A' && filter.group <= 'L') {
      where.group = filter.group;
    } else {
      // Caso contrário, pode ser filtro de matchday ou stage
      where.matchday = filter.group;
    }
  }

  const dbMatches = await prisma.match.findMany({
    where,
    orderBy: { kickOff: 'asc' },
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  });

  return dbMatches.map(m => ({
    id: m.id,
    externalId: m.externalId,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeFlag: m.homeFlag,
    awayFlag: m.awayFlag,
    homeTeamLogo: m.homeTeamLogo,
    awayTeamLogo: m.awayTeamLogo,
    homeLabel: m.homeLabel,
    awayLabel: m.awayLabel,
    kickOff: m.kickOff.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    stage: m.stage,
    matchday: m.matchday,
    group: m.group,
    elapsed: m.elapsed,
    predictionCount: m._count.predictions,
  }));
}

/**
 * Busca todos os usuários ordenados por pontos (ranking/leaderboard).
 */
export async function getUsers(): Promise<UserProfile[]> {
  await ensureUserExists('currentUser');
  const dbUsers = await prisma.user.findMany({
    orderBy: { points: 'desc' },
  });

  return dbUsers.map(u => ({
    id: u.id,
    name: u.name ?? 'Usuário',
    email: u.email,
    image: u.image ?? '👤',
    points: u.points,
    streak: u.streak,
    misses: u.misses,
  }));
}

/**
 * Busca todos os palpites de um usuário.
 */
export async function getPredictions(userId: string): Promise<PredictionData[]> {
  await ensureUserExists(userId);
  const dbPreds = await prisma.prediction.findMany({
    where: { userId },
  });

  return dbPreds.map(p => ({
    id: p.id,
    userId: p.userId,
    matchId: p.matchId,
    homeGuess: p.homeGuess,
    awayGuess: p.awayGuess,
    processed: p.processed,
  }));
}

/**
 * Salva (upsert) um palpite para um usuário em uma partida.
 * Aplica o Time Gate: palpites fecham 30 min antes do kickoff.
 */
export async function savePrediction(
  userId: string,
  matchId: string,
  homeGuess: number,
  awayGuess: number,
  windowHours: number = 48
): Promise<PredictionData> {
  await ensureUserExists(userId);
  // Buscar a partida do banco para validar Time Gate
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error('Partida não encontrada.');

  const now = Date.now();
  const kickoffTime = new Date(match.kickOff).getTime();
  const openTime = kickoffTime - windowHours * 60 * 60 * 1000;
  const limitTime = kickoffTime - 30 * 60 * 1000;

  if (now < openTime) {
    throw new Error(`Palpites ainda não abertos para esta partida (abrem ${windowHours} horas antes do início).`);
  }
  if (now > limitTime) {
    throw new Error('Palpites fechados para esta partida (limite de 30 minutos antes do início).');
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: { userId, matchId },
    },
    update: { homeGuess, awayGuess },
    create: { userId, matchId, homeGuess, awayGuess },
  });

  return {
    id: prediction.id,
    userId: prediction.userId,
    matchId: prediction.matchId,
    homeGuess: prediction.homeGuess,
    awayGuess: prediction.awayGuess,
    processed: prediction.processed,
  };
}

/**
 * Atualiza o placar de uma partida e dispara o Score Engine se finalizada.
 */
export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished'
): Promise<MatchData> {
  const elapsed = status === 'finished' ? 'finished' : status === 'live' ? 'live' : 'notstarted';

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status, elapsed },
  });

  // Se finalizado, rodar o Score Engine
  if (status === 'finished') {
    await processScoringForMatch(matchId);
  }

  return {
    id: updated.id,
    externalId: updated.externalId,
    homeTeam: updated.homeTeam,
    awayTeam: updated.awayTeam,
    homeFlag: updated.homeFlag,
    awayFlag: updated.awayFlag,
    homeTeamLogo: updated.homeTeamLogo,
    awayTeamLogo: updated.awayTeamLogo,
    homeLabel: updated.homeLabel,
    awayLabel: updated.awayLabel,
    kickOff: updated.kickOff.toISOString(),
    homeScore: updated.homeScore,
    awayScore: updated.awayScore,
    status: updated.status,
    stage: updated.stage,
    group: updated.group,
    matchday: updated.matchday,
    elapsed: updated.elapsed,
  };
}

/**
 * Motor de pontuação: processa todos os palpites não processados de uma partida.
 * Calcula pontos, atualiza User.points/streak/misses.
 */
export async function processScoringForMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.homeScore === null || match.awayScore === null) return;

  const homeScore = match.homeScore;
  const awayScore = match.awayScore;

  // Buscar palpites não processados para o jogo
  const predictions = await prisma.prediction.findMany({
    where: { matchId, processed: false },
  });

  for (const pred of predictions) {
    const points = calculatePredictionPoints(pred.homeGuess, pred.awayGuess, homeScore, awayScore);

    // Calcular streak/misses
    const isHit = points > 0;

    await prisma.user.update({
      where: { id: pred.userId },
      data: {
        points: { increment: points },
        streak: isHit ? { increment: 1 } : 0,
        misses: isHit ? 0 : { increment: 1 },
      },
    });

    // Marcar palpite como processado
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { processed: true },
    });
  }
}

/**
 * Calcula a porcentagem de palpites (casa/empate/fora) de uma partida.
 */
export async function getMatchStats(matchId: string): Promise<MatchStats> {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  const total = predictions.length;
  if (total === 0) {
    return { home: 0, draw: 0, away: 0, total: 0 };
  }

  let home = 0;
  let draw = 0;
  let away = 0;

  for (const p of predictions) {
    if (p.homeGuess > p.awayGuess) home++;
    else if (p.homeGuess < p.awayGuess) away++;
    else draw++;
  }

  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((away / total) * 100),
    total,
  };
}

// ─── Sincronização com API Externa ──────────────────────────────────

/**
 * Converte data no formato "MM/DD/YYYY HH:mm" da API externa para UTC real 
 * usando a região correspondente do fuso horário do estádio na Copa de 2026.
 */
function parseLocalDateWithOffset(dateStr: string, stadiumId: string): Date {
  // Formato: "06/11/2026 17:00"
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');

  // Mapeamento de fusos horários da Copa de 2026 (Horário de Verão em junho/julho):
  // Eastern (Boston, Miami, NY, Phila, Atlanta, Toronto): UTC-4
  // Central (CDT/Cidade do México, Monterrey, Guadalajara, Dallas, Houston, Kansas City): UTC-5
  // Western (Seattle, Vancouver, SF Bay Area, Los Angeles): UTC-7
  let offset = '-05:00'; // Central por padrão
  if (['7', '8', '9', '10', '11', '12'].includes(stadiumId)) {
    offset = '-04:00'; // Eastern
  } else if (['13', '14', '15', '16'].includes(stadiumId)) {
    offset = '-07:00'; // Western
  }

  const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00${offset}`;
  return new Date(isoString);
}

/**
 * Busca dados da WorldCup26.ir, faz upsert em massa no banco Match.
 * Retorna relatório de quantos foram criados/atualizados.
 */
export async function syncFromApi(): Promise<SyncReport> {
  const [games, teams] = await Promise.all([fetchGames(), fetchTeams()]);

  if (games.length === 0) {
    console.warn('[sync] Nenhuma partida retornada pela API externa.');
    return { created: 0, updated: 0, source: 'worldcup26' };
  }

  // Criar mapa de times para obter bandeiras
  const teamMap = new Map<string, ApiTeam>();
  for (const team of teams) {
    teamMap.set(team.id, team);
  }

  let created = 0;
  let updated = 0;

  for (const game of games) {
    const externalId = parseInt(game.id);
    const homeTeam = teamMap.get(game.home_team_id);
    const awayTeam = teamMap.get(game.away_team_id);

    const kickOff = parseLocalDateWithOffset(game.local_date, game.stadium_id);
    const isFinished = game.finished?.toUpperCase() === 'TRUE';
    const status = isFinished ? 'finished' : game.time_elapsed !== 'notstarted' ? 'live' : 'scheduled';

    const homeScore = isFinished || status === 'live' ? parseInt(game.home_score) || 0 : null;
    const awayScore = isFinished || status === 'live' ? parseInt(game.away_score) || 0 : null;

    const matchData = {
      homeTeam: game.home_team_name_en || game.home_team_label || 'TBD',
      awayTeam: game.away_team_name_en || game.away_team_label || 'TBD',
      homeFlag: homeTeam?.iso2 || null,
      awayFlag: awayTeam?.iso2 || null,
      homeTeamLogo: homeTeam?.flag || null,
      awayTeamLogo: awayTeam?.flag || null,
      homeLabel: game.home_team_label || null,
      awayLabel: game.away_team_label || null,
      kickOff,
      homeScore,
      awayScore,
      status,
      stage: game.type || 'group',
      group: game.group || null,
      matchday: game.matchday || null,
      elapsed: game.time_elapsed || 'notstarted',
      lastSyncAt: new Date(),
    };

    const existing = await prisma.match.findUnique({ where: { externalId } });
    let matchId = '';
    if (existing) {
      const updatedMatch = await prisma.match.update({
        where: { externalId },
        data: matchData,
      });
      matchId = updatedMatch.id;
      updated++;
    } else {
      const createdMatch = await prisma.match.create({
        data: {
          externalId,
          ...matchData,
        },
      });
      matchId = createdMatch.id;
      created++;
    }

    if (matchData.status === 'finished') {
      await processScoringForMatch(matchId);
    }
  }

  // Registrar log de sincronização
  await prisma.syncLog.create({
    data: {
      matchesCreated: created,
      matchesUpdated: updated,
      source: 'worldcup26',
    },
  });

  console.log(`[sync] Sincronização concluída: ${created} criadas, ${updated} atualizadas.`);
  return { created, updated, source: 'worldcup26' };
}

// ─── Funções Administrativas ────────────────────────────────────────

/**
 * Reseta toda a simulação no banco real.
 * Zera placares, status, pontos de usuários e palpites.
 */
export async function resetSimulation(): Promise<void> {
  // Resetar todos os palpites (marcar como não processados)
  await prisma.prediction.updateMany({
    data: { processed: false },
  });

  // Resetar placares das partidas
  await prisma.match.updateMany({
    data: {
      homeScore: null,
      awayScore: null,
      status: 'scheduled',
      elapsed: 'notstarted',
    },
  });

  // Zerar pontos/streak/misses dos usuários
  await prisma.user.updateMany({
    data: {
      points: 0,
      streak: 0,
      misses: 0,
    },
  });

  console.log('[reset] Simulação reiniciada com sucesso no banco.');
}

/**
 * Cria um competidor na sandbox (banco real).
 */
export async function createSandboxUser(name: string, image: string): Promise<UserProfile> {
  const email = `${name.toLowerCase().replace(/\s+/g, '')}@bolao.com`;

  const dbUser = await prisma.user.create({
    data: {
      name,
      email,
      image,
      points: 0,
      streak: 0,
      misses: 0,
    },
  });

  return {
    id: dbUser.id,
    name: dbUser.name ?? name,
    email: dbUser.email,
    image: dbUser.image ?? image,
    points: dbUser.points,
    streak: dbUser.streak,
    misses: dbUser.misses,
  };
}
