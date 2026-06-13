// src/lib/matches-service.ts
// Serviço de dados do bolão - 100% Prisma, sem mock, sem fallback em memória
import { prisma, withRetry } from './prisma';
import type { Prisma } from '@prisma/client';
import { fetchFootballSnapshot, type ApiTeam } from './football-api';
import { translateTeamName } from './team-translation';
import { parseMatchLocalDate } from './match-time';
import { calculatePredictionScore } from './scoring-domain';
import { mergeMatchSyncState, normalizeMatchStatus } from './match-sync-domain';
import type {
  BothTeamsScorePick,
  ResultPick,
  TotalGoalsPick,
} from './prediction-markets';
import { normalizePredictionMarketPicks } from './prediction-markets';

export { calculatePredictionScore } from './scoring-domain';

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
  leagueId: string;
  homeGuess: number;
  awayGuess: number;
  resultPick: ResultPick;
  totalGoalsPick: TotalGoalsPick;
  bothTeamsScorePick: BothTeamsScorePick;
  editCount: number;
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
  status: 'success' | 'degraded';
  error: string | null;
  durationMs: number;
}

// ─── Lógica de Pontuação (regras customizadas ou padrão GE) ──────────

export function calculatePredictionPoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
  rules?: {
    pointsExact: number;
    pointsDiff: number;
    pointsWinner: number;
    pointsWinnerHome?: number;
    pointsWinnerAway?: number;
    pointsDraw: number;
    pointsBothScoreYes?: number;
    pointsBothScoreNo?: number;
  },
  markets?: {
    resultPick?: ResultPick | null;
    totalGoalsPick?: TotalGoalsPick | null;
    bothTeamsScorePick?: BothTeamsScorePick | null;
  },
): number {
  return calculatePredictionScore(homeGuess, awayGuess, homeScore, awayScore, rules, markets).total;

}

// ─── Funções de Dados (Prisma direto) ────────────────────────────────

/**
 * Garante que o usuário existe no banco de dados para evitar violações de integridade.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const user = await withRetry(() => prisma.user.findUnique({ where: { id: userId } }));
  if (!user) {
    if (userId === 'currentUser') {
      await withRetry(() => prisma.user.create({
        data: {
          id: 'currentUser',
          name: 'Você (Torcedor)',
          email: 'usuario@copa.com',
          image: '👑',
          points: 0,
          streak: 0,
          misses: 0,
        },
      }));
    } else {
      await withRetry(() => prisma.user.create({
        data: {
          id: userId,
          name: `Competidor ${userId.substring(0, 5)}`,
          email: `${userId}@bolao.com`,
          image: '👤',
          points: 0,
          streak: 0,
          misses: 0,
        },
      }));
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

  const dbMatches = await withRetry(() => prisma.match.findMany({
    where,
    orderBy: { kickOff: 'asc' },
    include: {
      _count: {
        select: { predictions: true },
      },
    },
  }));

  return dbMatches.map(m => ({
    id: m.id,
    externalId: m.externalId,
    homeTeam: translateTeamName(m.homeTeam),
    awayTeam: translateTeamName(m.awayTeam),
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
  const dbUsers = await withRetry(() => prisma.user.findMany({
    orderBy: { points: 'desc' },
  }));

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
 * Busca todos os palpites de um usuário para um bolão específico.
 */
export async function getPredictions(userId: string, leagueId?: string): Promise<PredictionData[]> {
  await ensureUserExists(userId);
  const where: Prisma.PredictionWhereInput = { userId };
  if (leagueId) {
    where.leagueId = leagueId;
  }
  const dbPreds = await withRetry(() => prisma.prediction.findMany({
    where,
  }));

  return dbPreds.map(p => ({
    ...normalizePredictionMarketPicks(p),
    id: p.id,
    userId: p.userId,
    matchId: p.matchId,
    leagueId: p.leagueId,
    homeGuess: p.homeGuess,
    awayGuess: p.awayGuess,
    editCount: p.editCount,
    processed: p.processed,
  }));
}

/**
 * Salva (upsert) um palpite para um usuário em uma partida dentro de um bolão.
 * Aplica o limite de edições e a janela de tempo do respectivo bolão.
 */
export async function savePrediction(
  userId: string,
  matchId: string,
  homeGuess: number,
  awayGuess: number,
  leagueId: string = 'global',
  markets?: {
    resultPick?: ResultPick | null;
    totalGoalsPick?: TotalGoalsPick | null;
    bothTeamsScorePick?: BothTeamsScorePick | null;
  },
): Promise<PredictionData> {
  await ensureUserExists(userId);

  if (
    !Number.isInteger(homeGuess) ||
    !Number.isInteger(awayGuess) ||
    homeGuess < 0 ||
    awayGuess < 0 ||
    homeGuess > 99 ||
    awayGuess > 99
  ) {
    throw new Error('O placar deve conter números inteiros entre 0 e 99.');
  }

  // Buscar as regras do bolão correspondente, criando a global se não existir
  const marketPicks = normalizePredictionMarketPicks({
    homeGuess,
    awayGuess,
    resultPick: markets?.resultPick,
    totalGoalsPick: markets?.totalGoalsPick,
    bothTeamsScorePick: markets?.bothTeamsScorePick,
  });

  let league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league && leagueId === 'global') {
    league = await prisma.league.create({
      data: {
        id: 'global',
        slug: 'global',
        name: 'Bolão Global da Copa',
        description: 'O bolão oficial da plataforma para todos os torcedores.',
        inviteCode: 'COPA-GLOBAL',
        ownerId: userId,
        visibility: 'public',
        joinPolicy: 'open',
        expiresAt: new Date('2026-08-01T00:00:00Z'),
        windowHours: 48,
        maxEdits: 3,
      }
    });
  }
  if (!league) throw new Error('Bolão não encontrado.');

  // Garantir filiação do usuário ao bolão correspondente
  if (league.status !== 'active' || league.expiresAt <= new Date()) {
    throw new Error('Este bolão não está aceitando novos palpites.');
  }

  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } }
  });
  if (!membership) {
    if (leagueId !== 'global') {
      throw new Error('Você precisa participar deste bolão antes de palpitar.');
    }
    await prisma.leagueMember.create({
      data: {
        leagueId,
        userId,
        role: 'member',
        points: 0,
      }
    });
  } else if (membership.status !== 'active') {
    throw new Error('Sua participação neste bolão não está ativa.');
  }

  const windowHours = league.windowHours;
  const maxEdits = league.maxEdits;

  // Buscar a partida do banco para validar Time Gate
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error('Partida não encontrada.');

  const now = Date.now();
  const kickoffTime = new Date(match.kickOff).getTime();
  const openTime = kickoffTime - windowHours * 60 * 60 * 1000;
  const limitTime = kickoffTime - 30 * 60 * 1000;

  if (now < openTime) {
    throw new Error(`Palpites ainda não abertos para esta partida neste bolão (abrem ${windowHours} horas antes do início).`);
  }
  if (now > limitTime) {
    throw new Error('Palpites fechados para esta partida (limite de 30 minutos antes do início).');
  }

  // Verificar se o usuário já possui palpite para esta partida neste bolão
  const existing = await prisma.prediction.findUnique({
    where: {
      userId_matchId_leagueId: { userId, matchId, leagueId }
    }
  });

  let editCount = 0;
  if (existing) {
    if (existing.editCount >= maxEdits) {
      throw new Error(`Limite de edições (${maxEdits}) atingido para esta partida neste bolão.`);
    }
    editCount = existing.editCount + 1;
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId_leagueId: { userId, matchId, leagueId },
    },
    update: { homeGuess, awayGuess, ...marketPicks, editCount },
    create: { userId, matchId, leagueId, homeGuess, awayGuess, ...marketPicks, editCount: 0 },
  });

  return {
    ...normalizePredictionMarketPicks(prediction),
    id: prediction.id,
    userId: prediction.userId,
    matchId: prediction.matchId,
    leagueId: prediction.leagueId,
    homeGuess: prediction.homeGuess,
    awayGuess: prediction.awayGuess,
    editCount: prediction.editCount,
    processed: prediction.processed,
  };
}

/**
 * Atualiza o placar de uma partida e dispara o Score Engine se finalizada.
 */
async function recomputeGlobalUserPerformance(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const rows = await tx.prediction.findMany({
    where: {
      leagueId: 'global',
      userId,
      processed: true,
      match: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      pointEntry: { isNot: null },
    },
    orderBy: { match: { kickOff: 'asc' } },
    select: {
      pointEntry: { select: { points: true } },
    },
  });

  let points = 0;
  let streak = 0;
  let misses = 0;
  for (const row of rows) {
    const value = row.pointEntry?.points ?? 0;
    points += value;
    if (value > 0) {
      streak += 1;
      misses = 0;
    } else {
      streak = 0;
      misses += 1;
    }
  }

  await tx.user.update({
    where: { id: userId },
    data: { points, streak, misses },
  });
}

async function clearScoringForUnfinishedMatch(matchId: string) {
  await prisma.$transaction(async (tx) => {
    const entries = await tx.leaguePointEntry.findMany({
      where: { matchId },
      select: {
        leagueId: true,
        userId: true,
        points: true,
        status: true,
        cycleKey: true,
      },
    });

    if (entries.length === 0) {
      await tx.prediction.updateMany({
        where: { matchId, processed: true },
        data: { processed: false },
      });
      return;
    }

    const memberDeltas = new Map<string, { points: number; pendingPoints: number }>();
    const globalUserIds = new Set<string>();
    const affectedCycles = new Map<string, Set<string>>();

    for (const entry of entries) {
      if (entry.leagueId === 'global') {
        globalUserIds.add(entry.userId);
      } else {
        const key = `${entry.leagueId}:${entry.userId}`;
        const current = memberDeltas.get(key) ?? { points: 0, pendingPoints: 0 };
        if (entry.status === 'published') current.points += entry.points;
        else current.pendingPoints += entry.points;
        memberDeltas.set(key, current);
      }

      if (!affectedCycles.has(entry.leagueId)) affectedCycles.set(entry.leagueId, new Set());
      affectedCycles.get(entry.leagueId)?.add(entry.cycleKey);
    }

    for (const [leagueId, cycleKeys] of affectedCycles) {
      const cycles = await tx.leagueRankingCycle.findMany({
        where: { leagueId, key: { in: [...cycleKeys] } },
        select: { id: true },
      });
      if (cycles.length > 0) {
        const cycleIds = cycles.map((cycle) => cycle.id);
        await tx.leagueRankingSnapshot.deleteMany({
          where: { cycleId: { in: cycleIds } },
        });
        await tx.leagueRankingCycle.deleteMany({
          where: { id: { in: cycleIds } },
        });
      }
    }

    await tx.leaguePointEntry.deleteMany({ where: { matchId } });
    await tx.prediction.updateMany({
      where: { matchId, processed: true },
      data: { processed: false },
    });

    for (const [key, delta] of memberDeltas) {
      const [leagueId, userId] = key.split(':');
      await tx.leagueMember.updateMany({
        where: { leagueId, userId },
        data: {
          points: { decrement: delta.points },
          pendingPoints: { decrement: delta.pendingPoints },
        },
      });
    }

    for (const userId of globalUserIds) {
      await recomputeGlobalUserPerformance(tx, userId);
    }
  });
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished'
): Promise<MatchData> {
  const elapsed = status === 'finished' ? 'finished' : status === 'live' ? 'live' : 'notstarted';
  const scoreData =
    status === 'scheduled'
      ? { homeScore: null, awayScore: null }
      : { homeScore, awayScore };

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { ...scoreData, status, elapsed },
  });

  // Se finalizado, rodar o Score Engine
  if (status === 'finished') {
    const { processLeagueScoringForMatch } = await import('./scoring-service');
    await processLeagueScoringForMatch(matchId);
  } else {
    await clearScoringForUnfinishedMatch(matchId);
  }

  return {
    id: updated.id,
    externalId: updated.externalId,
    homeTeam: translateTeamName(updated.homeTeam),
    awayTeam: translateTeamName(updated.awayTeam),
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
 * Calcula a porcentagem de palpites (casa/empate/fora) de uma partida para um bolão específico.
 */
export async function getMatchStats(matchId: string, leagueId?: string): Promise<MatchStats> {
  const where: Prisma.PredictionWhereInput = { matchId };
  if (leagueId) {
    where.leagueId = leagueId;
  }
  const predictions = await prisma.prediction.findMany({
    where,
  });

  const total = predictions.length;
  if (total === 0) {
    return { home: 0, draw: 0, away: 0, total: 0 };
  }

  let home = 0;
  let draw = 0;
  let away = 0;

  for (const p of predictions) {
    const resultPick = normalizePredictionMarketPicks(p).resultPick;
    if (resultPick === 'home') home++;
    else if (resultPick === 'away') away++;
    else draw++;
  }

  return {
    home: Math.round((home / total) * 100),
    draw: Math.round((draw / total) * 100),
    away: Math.round((away / total) * 100),
    total,
  };
}

export async function getMatchStatsBatch(
  matchIds: string[],
  leagueId?: string
): Promise<Record<string, MatchStats>> {
  const uniqueMatchIds = [...new Set(matchIds)].filter(Boolean);
  if (uniqueMatchIds.length === 0) {
    return {};
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      matchId: { in: uniqueMatchIds },
      ...(leagueId ? { leagueId } : {}),
    },
    select: {
      matchId: true,
      homeGuess: true,
      awayGuess: true,
      resultPick: true,
      totalGoalsPick: true,
      bothTeamsScorePick: true,
    },
  });

  const counters = new Map<string, { home: number; draw: number; away: number; total: number }>();
  for (const matchId of uniqueMatchIds) {
    counters.set(matchId, { home: 0, draw: 0, away: 0, total: 0 });
  }

  for (const prediction of predictions) {
    const stats = counters.get(prediction.matchId);
    if (!stats) continue;
    stats.total++;
    const resultPick = normalizePredictionMarketPicks(prediction).resultPick;
    if (resultPick === 'home') stats.home++;
    else if (resultPick === 'away') stats.away++;
    else stats.draw++;
  }

  const result: Record<string, MatchStats> = {};
  for (const [matchId, stats] of counters) {
    result[matchId] =
      stats.total === 0
        ? { home: 0, draw: 0, away: 0, total: 0 }
        : {
            home: Math.round((stats.home / stats.total) * 100),
            draw: Math.round((stats.draw / stats.total) * 100),
            away: Math.round((stats.away / stats.total) * 100),
            total: stats.total,
          };
  }

  return result;
}

// ─── Sincronização com API Externa ──────────────────────────────────

/**
 * Converte data no formato "MM/DD/YYYY HH:mm" da API externa para UTC real 
 * usando a região correspondente do fuso horário do estádio na Copa de 2026.
 */
function parseLocalDateWithOffset(dateStr: string, stadiumId: string): Date {
  return parseMatchLocalDate(dateStr, stadiumId);
  /*
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
  */
}

/**
 * Busca dados da WorldCup26.ir, faz upsert em massa no banco Match.
 * Retorna relatório de quantos foram criados/atualizados.
 */
export async function syncFromApi(trigger = 'manual'): Promise<SyncReport> {
  const startedAt = Date.now();
  const snapshot = await fetchFootballSnapshot();
  const games = snapshot.games;
  const teams = snapshot.teams;
  const errors = snapshot.error ? [snapshot.error] : [];
  let status: SyncReport['status'] = snapshot.source === 'api' ? 'success' : 'degraded';
  const source = snapshot.source === 'api' ? 'worldcup26' : 'backup';
  const existingMatchCount = await prisma.match.count();

  if (snapshot.source === 'backup' && existingMatchCount > 0) {
    const error = `${snapshot.error || 'API principal invalida.'} Ultimo estado valido do banco foi preservado.`;
    await prisma.syncLog.create({
      data: {
        source: 'database',
        status: 'degraded',
        trigger,
        error,
        durationMs: Date.now() - startedAt,
      },
    });
    return {
      created: 0,
      updated: 0,
      source: 'database',
      status: 'degraded',
      error,
      durationMs: Date.now() - startedAt,
    };
  }

  if (games.length === 0) {
    console.warn('[sync] Nenhuma partida retornada pela API externa.');
    throw new Error('Nenhuma partida retornada pela API externa ou pelo backup.');
  }

  // Criar mapa de times para obter bandeiras
  const teamMap = new Map<string, ApiTeam>();
  for (const team of teams) {
    teamMap.set(team.id, team);
  }

  const syncedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    const finishedMatchIds: string[] = [];

    for (const game of games) {
      const externalId = Number(game.id);
      const homeTeam = teamMap.get(game.home_team_id);
      const awayTeam = teamMap.get(game.away_team_id);
      const kickOff = parseLocalDateWithOffset(game.local_date, game.stadium_id);
      const incomingStatus = normalizeMatchStatus(game.finished, game.time_elapsed);
      const homeName = game.home_team_name_en || game.home_team_label || 'TBD';
      const awayName = game.away_team_name_en || game.away_team_label || 'TBD';
      const incomingState = {
        status: incomingStatus,
        elapsed: game.time_elapsed || 'notstarted',
        homeScore: incomingStatus === 'scheduled' ? null : Number(game.home_score) || 0,
        awayScore: incomingStatus === 'scheduled' ? null : Number(game.away_score) || 0,
      };

      const existing = await tx.match.findFirst({
        where: {
          OR: [
            { externalId },
            {
              externalId: null,
              homeTeam: homeName,
              awayTeam: awayName,
              kickOff,
            },
          ],
        },
      });
      const state = mergeMatchSyncState(existing, incomingState);
      const matchData = {
        externalId,
        homeTeam: homeName,
        awayTeam: awayName,
        homeFlag: homeTeam?.iso2 || null,
        awayFlag: awayTeam?.iso2 || null,
        homeTeamLogo: homeTeam?.flag || null,
        awayTeamLogo: awayTeam?.flag || null,
        homeLabel: game.home_team_label || null,
        awayLabel: game.away_team_label || null,
        kickOff,
        homeScore: state.homeScore,
        awayScore: state.awayScore,
        status: state.status,
        stage: game.type || 'group',
        group: game.group || null,
        matchday: game.matchday || null,
        elapsed: state.elapsed,
        lastSyncAt: syncedAt,
      };

      const match = existing
        ? await tx.match.update({ where: { id: existing.id }, data: matchData })
        : await tx.match.create({ data: matchData });
      if (existing) updated++;
      else created++;
      if (match.status === 'finished') finishedMatchIds.push(match.id);
    }

    return { created, updated, finishedMatchIds };
  }, { maxWait: 10_000, timeout: 120_000 });

  for (const matchId of result.finishedMatchIds) {
    try {
      const { processLeagueScoringForMatch } = await import('./scoring-service');
      await processLeagueScoringForMatch(matchId);
    } catch (error) {
      status = 'degraded';
      errors.push(`Pontuacao ${matchId}: ${error instanceof Error ? error.message : 'falhou'}`);
    }
  }

  // Registrar log de sincronização
  await prisma.syncLog.create({
    data: {
      matchesCreated: result.created,
      matchesUpdated: result.updated,
      source,
      status,
      trigger,
      error: errors.join(' ') || null,
      durationMs: Date.now() - startedAt,
    },
  });

  console.log(`[sync] Sincronização concluída: ${result.created} criadas, ${result.updated} atualizadas.`);
  return {
    created: result.created,
    updated: result.updated,
    source,
    status,
    error: errors.join(' ') || null,
    durationMs: Date.now() - startedAt,
  };
}

// ─── Funções Administrativas ────────────────────────────────────────

/**
 * Reseta toda a simulação no banco real.
 * Zera placares, status, pontos de usuários e palpites.
 */
export async function resetSimulation(): Promise<void> {
  await prisma.leagueRankingSnapshot.deleteMany();
  await prisma.leagueRankingCycle.deleteMany();
  await prisma.leaguePointEntry.deleteMany();
  await prisma.leagueMember.updateMany({
    data: { points: 0, pendingPoints: 0 },
  });
  await prisma.league.updateMany({
    data: { lastPublishedAt: null },
  });

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
      emailVerified: null,
      passwordHash: null,
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

/**
 * Retorna o status de todas as rodadas (matchdays) com base no status dos seus jogos.
 */
export async function getRoundStatuses(): Promise<Record<string, 'scheduled' | 'in_progress' | 'finished'>> {
  const matches = await prisma.match.findMany({
    where: { matchday: { not: null } },
    select: { matchday: true, status: true },
  });

  const rounds: Record<string, { total: number; finished: number; scheduled: number }> = {};

  for (const match of matches) {
    const day = match.matchday!;
    if (!rounds[day]) {
      rounds[day] = { total: 0, finished: 0, scheduled: 0 };
    }
    rounds[day].total += 1;
    if (match.status === 'finished') {
      rounds[day].finished += 1;
    } else if (match.status === 'scheduled') {
      rounds[day].scheduled += 1;
    }
  }

  const result: Record<string, 'scheduled' | 'in_progress' | 'finished'> = {};
  for (const [day, stats] of Object.entries(rounds)) {
    if (stats.finished === stats.total) {
      result[day] = 'finished';
    } else if (stats.scheduled === stats.total) {
      result[day] = 'scheduled';
    } else {
      result[day] = 'in_progress';
    }
  }

  return result;
}
