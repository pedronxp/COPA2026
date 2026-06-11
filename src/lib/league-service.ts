import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  GROUP_PUBLICATION_MODES,
  KNOCKOUT_PUBLICATION_MODES,
  LEAGUE_JOIN_POLICIES,
  LEAGUE_STATUSES,
  LEAGUE_VISIBILITIES,
  LeagueValidationError,
  createLeagueSlug,
  isOneOf,
  normalizeInviteCode,
  validateLeagueConfiguration,
} from '@/lib/league-domain';

type DbClient = Prisma.TransactionClient;

const ACTIVE_MEMBER = { status: 'active' } as const;
const ADMIN_ROLES = new Set(['owner', 'subadmin']);
const COMPETITIVE_FIELDS = new Set([
  'scoringPreset',
  'scoringStartMatchday',
  'groupPublicationMode',
  'knockoutPublicationMode',
  'expiresAt',
  'windowHours',
  'maxEdits',
  'pointsExact',
  'pointsDiff',
  'pointsWinner',
  'pointsWinnerHome',
  'pointsWinnerAway',
  'pointsDraw',
]);

export class LeagueServiceError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = 'LEAGUE_ERROR',
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'LeagueServiceError';
  }
}

function serviceError(
  message: string,
  status: number,
  code: string,
  field?: string,
): never {
  throw new LeagueServiceError(message, status, code, field);
}

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

async function serializable<T>(
  operation: (tx: DbClient) => Promise<T>,
  retries = 3,
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: 'Serializable',
      });
    } catch (error) {
      if (isPrismaError(error, 'P2034') && attempt < retries - 1) continue;
      throw error;
    }
  }

  throw new LeagueServiceError(
    'Não foi possível concluir a operação concorrente.',
    409,
    'CONCURRENT_WRITE',
  );
}

function rankMembers<
  T extends {
    userId: string;
    points: number;
    joinedAt: Date;
    user: { name: string | null; image: string | null };
  },
>(members: T[]) {
  let previousPoints: number | null = null;
  let sharedRank = 0;

  return members.map((member, index) => {
    if (previousPoints !== member.points) {
      sharedRank = index + 1;
      previousPoints = member.points;
    }

    return {
      id: member.userId,
      name: member.user.name || 'Usuário',
      image: member.user.image,
      points: member.points,
      rank: sharedRank,
    };
  });
}

function scoringProjection(league: {
  scoringPreset: string;
  scoringStartMatchday: number;
  groupPublicationMode: string;
  knockoutPublicationMode: string;
  windowHours: number;
  maxEdits: number;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
}) {
  return {
    preset: league.scoringPreset,
    scoringPreset: league.scoringPreset,
    scoringStartMatchday: league.scoringStartMatchday,
    groupPublicationMode: league.groupPublicationMode,
    knockoutPublicationMode: league.knockoutPublicationMode,
    windowHours: league.windowHours,
    maxEdits: league.maxEdits,
    pointsExact: league.pointsExact,
    pointsDiff: league.pointsDiff,
    pointsWinner: league.pointsWinner,
    pointsWinnerHome: league.pointsWinnerHome,
    pointsWinnerAway: league.pointsWinnerAway,
    pointsDraw: league.pointsDraw,
  };
}

function baseProjection(league: {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  visibility: string;
  joinPolicy: string;
  status: string;
  maxMembers: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string | null; image: string | null };
}) {
  return {
    id: league.id,
    slug: league.slug,
    name: league.name,
    description: league.description,
    visibility: league.visibility,
    joinPolicy: league.joinPolicy,
    status: league.status,
    maxMembers: league.maxMembers,
    expiresAt: league.expiresAt,
    createdAt: league.createdAt,
    updatedAt: league.updatedAt,
    owner: {
      id: league.owner.id,
      name: league.owner.name || 'Usuário',
      image: league.owner.image,
    },
    ownerId: league.owner.id,
    ownerName: league.owner.name || 'Usuário',
    ownerImage: league.owner.image,
  };
}

async function resolveLeague(
  db: DbClient | typeof prisma,
  reference: string,
  select?: Prisma.LeagueSelect,
) {
  const normalized = reference.trim();
  if (!normalized) {
    serviceError('Identificador do bolão obrigatório.', 400, 'LEAGUE_REQUIRED');
  }

  return db.league.findFirst({
    where: {
      OR: [{ id: normalized }, { slug: createLeagueSlug(normalized) }],
    },
    select,
  });
}

async function requireLeague(
  db: DbClient | typeof prisma,
  reference: string,
  select?: Prisma.LeagueSelect,
) {
  const league = await resolveLeague(db, reference, select);
  if (!league) {
    serviceError('Bolão não encontrado.', 404, 'LEAGUE_NOT_FOUND');
  }
  return league;
}

async function requireMembership(
  db: DbClient | typeof prisma,
  leagueId: string,
  userId: string,
) {
  const membership = await db.leagueMember.findFirst({
    where: { leagueId, userId, ...ACTIVE_MEMBER },
  });
  if (!membership) {
    serviceError('Acesso negado ao bolão.', 403, 'MEMBERSHIP_REQUIRED');
  }
  return membership;
}

async function requireAdmin(
  db: DbClient | typeof prisma,
  leagueId: string,
  userId: string,
) {
  const membership = await requireMembership(db, leagueId, userId);
  if (!ADMIN_ROLES.has(membership.role)) {
    serviceError(
      'Apenas administradores podem executar esta ação.',
      403,
      'ADMIN_REQUIRED',
    );
  }
  return membership;
}

async function requireOwner(
  db: DbClient | typeof prisma,
  leagueId: string,
  userId: string,
) {
  const membership = await requireMembership(db, leagueId, userId);
  if (membership.role !== 'owner') {
    serviceError(
      'Apenas o dono pode executar esta ação.',
      403,
      'OWNER_REQUIRED',
    );
  }
  return membership;
}

function createInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = 'COPA-';
  for (let index = 0; index < 7; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

async function getAvailableSlug(db: DbClient, requested: string) {
  const base = createLeagueSlug(requested);
  const existing = await db.league.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const used = new Set(existing.map((item) => item.slug).filter(Boolean));

  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function joinableStatus(status: string) {
  if (status === 'active') return;
  serviceError(
    status === 'archived'
      ? 'Este bolão está arquivado.'
      : 'Este bolão não aceita novos membros.',
    409,
    'LEAGUE_NOT_JOINABLE',
  );
}

async function assertCapacity(db: DbClient, leagueId: string, maxMembers: number) {
  const memberCount = await db.leagueMember.count({
    where: { leagueId, ...ACTIVE_MEMBER },
  });
  if (memberCount >= maxMembers) {
    serviceError('O bolão atingiu o limite de participantes.', 409, 'LEAGUE_FULL');
  }
}

async function addMembership(
  db: DbClient,
  league: { id: string; maxMembers: number },
  userId: string,
) {
  const existing = await db.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId } },
  });
  if (existing?.status === 'active') {
    serviceError('Você já faz parte deste bolão.', 409, 'ALREADY_MEMBER');
  }

  await assertCapacity(db, league.id, league.maxMembers);

  if (existing) {
    return db.leagueMember.update({
      where: { id: existing.id },
      data: { status: 'active', role: 'member', joinedAt: new Date() },
    });
  }

  return db.leagueMember.create({
    data: {
      leagueId: league.id,
      userId,
      role: 'member',
      status: 'active',
    },
  });
}

export async function listMyLeagues(userId: string) {
  const memberships = await prisma.leagueMember.findMany({
    where: { userId, ...ACTIVE_MEMBER },
    include: {
      league: {
        include: {
          owner: { select: { id: true, name: true, image: true } },
          _count: {
            select: { members: { where: ACTIVE_MEMBER } },
          },
        },
      },
    },
    orderBy: { league: { createdAt: 'desc' } },
  });

  if (memberships.length === 0) return [];

  const leagueIds = memberships.map((membership) => membership.leagueId);
  const rankedMembers = await prisma.leagueMember.findMany({
    where: { leagueId: { in: leagueIds }, ...ACTIVE_MEMBER },
    orderBy: [
      { leagueId: 'asc' },
      { points: 'desc' },
      { joinedAt: 'asc' },
      { userId: 'asc' },
    ],
    select: {
      leagueId: true,
      userId: true,
      points: true,
      joinedAt: true,
      user: { select: { name: true, image: true } },
    },
  });
  const rankingByLeague = new Map<string, ReturnType<typeof rankMembers>>();

  for (const leagueId of leagueIds) {
    rankingByLeague.set(
      leagueId,
      rankMembers(rankedMembers.filter((member) => member.leagueId === leagueId)),
    );
  }

  return memberships.map((membership) => {
    const league = membership.league;
    const ranking = rankingByLeague.get(league.id) || [];
    const userRow = ranking.find((row) => row.id === userId);
    const leader = ranking[0] || null;
    return {
      ...baseProjection(league),
      ...scoringProjection(league),
      memberCount: league._count.members,
      userRole: membership.role,
      userPoints: membership.points,
      userRank: userRow?.rank || 0,
      isUserLeader: leader?.id === userId && leader.points > 0,
      leader,
      leaderPoints: leader?.points || 0,
      inviteCode: league.inviteCode,
      rulesLockedAt: league.rulesLockedAt,
      lastPublishedAt: league.lastPublishedAt,
    };
  });
}

export async function discoverPublicLeagues(input: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const search = input.search?.trim().slice(0, 80);
  const status =
    input.status && isOneOf(input.status, LEAGUE_STATUSES)
      ? input.status
      : 'active';
  const limit = Math.min(Math.max(Math.trunc(input.limit || 24), 1), 50);
  const offset = Math.max(Math.trunc(input.offset || 0), 0);
  const where: Prisma.LeagueWhereInput = {
    visibility: 'public',
    status,
    id: { not: 'global' },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, leagues] = await prisma.$transaction([
    prisma.league.count({ where }),
    prisma.league.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: {
          where: ACTIVE_MEMBER,
          orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
          take: 5,
          select: {
            userId: true,
            points: true,
            joinedAt: true,
            user: { select: { name: true, image: true } },
          },
        },
        _count: { select: { members: { where: ACTIVE_MEMBER } } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    total,
    limit,
    offset,
    leagues: leagues.map((league) => {
      const preview = rankMembers(league.members);
      return {
        ...baseProjection(league),
        scoring: scoringProjection(league),
        memberCount: league._count.members,
        leader: preview[0] || null,
        rankingPreview: preview,
      };
    }),
  };
}

export async function createLeague(userId: string, input: Record<string, unknown>) {
  let configuration;
  try {
    configuration = validateLeagueConfiguration(input);
  } catch (error) {
    if (error instanceof LeagueValidationError) {
      throw new LeagueServiceError(error.message, 400, 'VALIDATION_ERROR', error.field);
    }
    throw error;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await serializable(async (tx) => {
        const slug = await getAvailableSlug(tx, configuration.requestedSlug);
        const league = await tx.league.create({
          data: {
            slug,
            name: configuration.name,
            description: configuration.description,
            inviteCode: createInviteCode(),
            ownerId: userId,
            visibility: configuration.visibility,
            joinPolicy: configuration.joinPolicy,
            status: configuration.status,
            maxMembers: configuration.maxMembers,
            scoringPreset: configuration.scoringPreset,
            scoringStartMatchday: configuration.scoringStartMatchday,
            groupPublicationMode: configuration.groupPublicationMode,
            knockoutPublicationMode: configuration.knockoutPublicationMode,
            expiresAt: configuration.expiresAt,
            windowHours: configuration.windowHours,
            maxEdits: configuration.maxEdits,
            pointsExact: configuration.pointsExact,
            pointsDiff: configuration.pointsDiff,
            pointsWinner: configuration.pointsWinner,
            pointsWinnerHome: configuration.pointsWinnerHome,
            pointsWinnerAway: configuration.pointsWinnerAway,
            pointsDraw: configuration.pointsDraw,
          },
          include: {
            owner: { select: { id: true, name: true, image: true } },
          },
        });

        await tx.leagueMember.create({
          data: {
            leagueId: league.id,
            userId,
            role: 'owner',
            status: 'active',
          },
        });

        return {
          ...baseProjection(league),
          ...scoringProjection(league),
          inviteCode: league.inviteCode,
          memberCount: 1,
          userRole: 'owner',
          userPoints: 0,
          userRank: 1,
        };
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002') && attempt < 4) continue;
      throw error;
    }
  }

  throw new LeagueServiceError(
    'Não foi possível gerar identificadores únicos para o bolão.',
    409,
    'IDENTIFIER_COLLISION',
  );
}

export async function getLeagueDetail(reference: string, userId?: string) {
  const normalized = reference.trim();
  const league = await prisma.league.findFirst({
    where: {
      OR: [{ id: normalized }, { slug: createLeagueSlug(normalized) }],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        where: ACTIVE_MEMBER,
        orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
        take: 5,
        select: {
          userId: true,
          points: true,
          joinedAt: true,
          user: { select: { name: true, image: true } },
        },
      },
      _count: {
        select: {
          members: { where: ACTIVE_MEMBER },
          joinRequests: { where: { status: 'pending' } },
          pointEntries: { where: { status: 'pending' } },
        },
      },
    },
  });
  if (!league) {
    serviceError('Bolão não encontrado.', 404, 'LEAGUE_NOT_FOUND');
  }

  const membership = userId
    ? await prisma.leagueMember.findFirst({
        where: { leagueId: league.id, userId, ...ACTIVE_MEMBER },
      })
    : null;

  if (league.visibility === 'private' && !membership) {
    return {
      id: league.id,
      slug: league.slug,
      name: league.name,
      visibility: league.visibility,
      joinPolicy: league.joinPolicy,
      status: league.status,
      access: 'restricted' as const,
    };
  }

  const preview = rankMembers(league.members);
  const isAdmin = membership ? ADMIN_ROLES.has(membership.role) : false;

  return {
    ...baseProjection(league),
    access: membership ? ('member' as const) : ('public' as const),
    scoring: scoringProjection(league),
    memberCount: league._count.members,
    leader: preview[0] || null,
    rankingPreview: preview,
    userRole: membership?.role || null,
    inviteCode: membership ? league.inviteCode : undefined,
    rulesLockedAt: league.rulesLockedAt,
    lastPublishedAt: league.lastPublishedAt,
    hasPendingPoints: league._count.pointEntries > 0,
    pendingRequestCount: isAdmin ? league._count.joinRequests : undefined,
  };
}

function normalizeUpdate(
  current: {
    name: string;
    description: string | null;
    visibility: string;
    joinPolicy: string;
    maxMembers: number;
    scoringPreset: string;
    scoringStartMatchday: number;
    groupPublicationMode: string;
    knockoutPublicationMode: string;
    expiresAt: Date;
    windowHours: number;
    maxEdits: number;
    pointsExact: number;
    pointsDiff: number;
    pointsWinner: number;
    pointsWinnerHome: number;
    pointsWinnerAway: number;
    pointsDraw: number;
  },
  input: Record<string, unknown>,
) {
  let validated;
  try {
    validated = validateLeagueConfiguration({
      name: input.name ?? current.name,
      description: input.description ?? current.description ?? '',
      visibility: input.visibility ?? current.visibility,
      joinPolicy: input.joinPolicy ?? current.joinPolicy,
      maxMembers: input.maxMembers ?? current.maxMembers,
      scoringPreset: input.scoringPreset ?? current.scoringPreset,
      scoringStartMatchday:
        input.scoringStartMatchday ?? current.scoringStartMatchday,
      groupPublicationMode:
        input.groupPublicationMode ?? current.groupPublicationMode,
      knockoutPublicationMode:
        input.knockoutPublicationMode ?? current.knockoutPublicationMode,
      expiresAt: input.expiresAt ?? current.expiresAt,
      windowHours: input.windowHours ?? current.windowHours,
      maxEdits: input.maxEdits ?? current.maxEdits,
      pointsExact: input.pointsExact ?? current.pointsExact,
      pointsDiff: input.pointsDiff ?? current.pointsDiff,
      pointsWinner: input.pointsWinner ?? current.pointsWinner,
      pointsWinnerHome: input.pointsWinnerHome ?? current.pointsWinnerHome,
      pointsWinnerAway: input.pointsWinnerAway ?? current.pointsWinnerAway,
      pointsDraw: input.pointsDraw ?? current.pointsDraw,
    });
  } catch (error) {
    if (error instanceof LeagueValidationError) {
      throw new LeagueServiceError(error.message, 400, 'VALIDATION_ERROR', error.field);
    }
    throw error;
  }

  return validated;
}

export async function updateLeague(
  reference: string,
  userId: string,
  input: Record<string, unknown>,
) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference);
    const actor = await requireAdmin(tx, league.id, userId);
    const requestedStatus =
      typeof input.status === 'string' ? input.status : league.status;

    if (!isOneOf(requestedStatus, LEAGUE_STATUSES)) {
      serviceError('Status do bolão inválido.', 400, 'VALIDATION_ERROR', 'status');
    }
    if (requestedStatus !== league.status && actor.role !== 'owner') {
      serviceError(
        'Apenas o dono pode alterar o status do bolão.',
        403,
        'OWNER_REQUIRED',
      );
    }
    if (league.status === 'archived' && requestedStatus !== 'archived') {
      serviceError(
        'Um bolão arquivado não pode ser reaberto.',
        409,
        'ARCHIVE_IS_FINAL',
      );
    }

    const configuration = normalizeUpdate(league, input);
    const normalizedValues = configuration as Record<string, unknown>;
    const competitiveChange = Object.keys(input).some(
      (field) => {
        if (!COMPETITIVE_FIELDS.has(field) || input[field] === undefined) {
          return false;
        }
        const currentValue = league[field as keyof typeof league];
        const nextValue = normalizedValues[field];
        if (currentValue instanceof Date && nextValue instanceof Date) {
          return currentValue.getTime() !== nextValue.getTime();
        }
        return currentValue !== nextValue;
      },
    );
    if (competitiveChange) {
      const hasPredictions =
        league.rulesLockedAt !== null ||
        (await tx.prediction.count({ where: { leagueId: league.id }, take: 1 })) > 0;
      if (hasPredictions) {
        serviceError(
          'As regras competitivas foram bloqueadas pelo primeiro palpite.',
          409,
          'RULES_LOCKED',
        );
      }
    }

    const memberCount = await tx.leagueMember.count({
      where: { leagueId: league.id, ...ACTIVE_MEMBER },
    });
    if (configuration.maxMembers < memberCount) {
      serviceError(
        'O limite não pode ser menor que o número atual de membros.',
        409,
        'CAPACITY_BELOW_MEMBERS',
        'maxMembers',
      );
    }

    return tx.league.update({
      where: { id: league.id },
      data: {
        name: configuration.name,
        description: configuration.description,
        visibility: configuration.visibility,
        joinPolicy: configuration.joinPolicy,
        status: requestedStatus,
        maxMembers: configuration.maxMembers,
        scoringPreset: configuration.scoringPreset,
        scoringStartMatchday: configuration.scoringStartMatchday,
        groupPublicationMode: configuration.groupPublicationMode,
        knockoutPublicationMode: configuration.knockoutPublicationMode,
        expiresAt: configuration.expiresAt,
        windowHours: configuration.windowHours,
        maxEdits: configuration.maxEdits,
        pointsExact: configuration.pointsExact,
        pointsDiff: configuration.pointsDiff,
        pointsWinner: configuration.pointsWinner,
        pointsWinnerHome: configuration.pointsWinnerHome,
        pointsWinnerAway: configuration.pointsWinnerAway,
        pointsDraw: configuration.pointsDraw,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        visibility: true,
        joinPolicy: true,
        status: true,
        maxMembers: true,
        scoringPreset: true,
        scoringStartMatchday: true,
        groupPublicationMode: true,
        knockoutPublicationMode: true,
        expiresAt: true,
        windowHours: true,
        maxEdits: true,
        pointsExact: true,
        pointsDiff: true,
        pointsWinner: true,
        pointsWinnerHome: true,
        pointsWinnerAway: true,
        pointsDraw: true,
        rulesLockedAt: true,
        lastPublishedAt: true,
        updatedAt: true,
      },
    });
  });
}

export async function joinLeague(
  userId: string,
  input: { reference?: string; inviteCode?: string },
) {
  return serializable(async (tx) => {
    const inviteCode = input.inviteCode
      ? normalizeInviteCode(input.inviteCode)
      : undefined;
    const league = input.reference
      ? await resolveLeague(tx, input.reference)
      : inviteCode
        ? await tx.league.findUnique({ where: { inviteCode } })
        : null;

    if (!league) {
      serviceError(
        inviteCode
          ? 'Convite inválido ou revogado.'
          : 'Bolão não encontrado.',
        404,
        inviteCode ? 'INVALID_INVITE' : 'LEAGUE_NOT_FOUND',
      );
    }

    joinableStatus(league.status);

    const existing = await tx.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId } },
    });
    if (existing?.status === 'active') {
      serviceError('Você já faz parte deste bolão.', 409, 'ALREADY_MEMBER');
    }

    if (league.joinPolicy === 'invite') {
      if (!inviteCode || inviteCode !== league.inviteCode) {
        serviceError(
          'Convite inválido ou revogado.',
          404,
          'INVALID_INVITE',
        );
      }
    }

    if (league.joinPolicy === 'approval') {
      const request = await tx.leagueJoinRequest.upsert({
        where: { leagueId_userId: { leagueId: league.id, userId } },
        create: { leagueId: league.id, userId, status: 'pending' },
        update: {
          status: 'pending',
          reviewedAt: null,
          reviewedById: null,
        },
      });
      return {
        outcome: 'pending' as const,
        requestId: request.id,
        message: 'Solicitação enviada para aprovação.',
        league: { id: league.id, slug: league.slug, name: league.name },
      };
    }

    await addMembership(tx, league, userId);
    await tx.leagueJoinRequest.updateMany({
      where: { leagueId: league.id, userId },
      data: { status: 'approved', reviewedAt: new Date() },
    });

    return {
      outcome: 'joined' as const,
      message: `Você entrou no bolão "${league.name}" com sucesso!`,
      league: { id: league.id, slug: league.slug, name: league.name },
    };
  });
}

export async function listJoinRequests(reference: string, userId: string) {
  const league = await requireLeague(prisma, reference, { id: true });
  await requireAdmin(prisma, league.id, userId);

  return prisma.leagueJoinRequest.findMany({
    where: { leagueId: league.id, status: 'pending' },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function decideJoinRequest(
  reference: string,
  userId: string,
  requestId: string,
  decision: 'approve' | 'reject',
) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference);
    await requireAdmin(tx, league.id, userId);
    const request = await tx.leagueJoinRequest.findFirst({
      where: { id: requestId, leagueId: league.id },
    });
    if (!request) {
      serviceError('Solicitação não encontrada.', 404, 'REQUEST_NOT_FOUND');
    }
    if (request.status !== 'pending') {
      serviceError(
        'Esta solicitação já foi processada.',
        409,
        'REQUEST_ALREADY_REVIEWED',
      );
    }

    if (decision === 'approve') {
      joinableStatus(league.status);
      const existing = await tx.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: league.id, userId: request.userId },
        },
      });
      if (!existing || existing.status !== 'active') {
        await addMembership(tx, league, request.userId);
      }
    }

    const reviewedAt = new Date();
    await tx.leagueJoinRequest.update({
      where: { id: request.id },
      data: {
        status: decision === 'approve' ? 'approved' : 'rejected',
        reviewedById: userId,
        reviewedAt,
      },
    });

    return {
      success: true,
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewedAt,
    };
  });
}

export async function leaveLeague(reference: string, userId: string) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference, { id: true });
    const membership = await requireMembership(tx, league.id, userId);
    if (membership.role === 'owner') {
      serviceError(
        'Transfira a propriedade antes de sair do bolão.',
        409,
        'OWNER_CANNOT_LEAVE',
      );
    }

    await tx.leagueMember.delete({ where: { id: membership.id } });
    await tx.leagueJoinRequest.deleteMany({
      where: { leagueId: league.id, userId },
    });
    return { success: true };
  });
}

export async function rotateLeagueInvite(reference: string, userId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await serializable(async (tx) => {
        const league = await requireLeague(tx, reference, { id: true });
        await requireAdmin(tx, league.id, userId);
        return tx.league.update({
          where: { id: league.id },
          data: { inviteCode: createInviteCode() },
          select: { id: true, slug: true, inviteCode: true, updatedAt: true },
        });
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002') && attempt < 4) continue;
      throw error;
    }
  }
  serviceError('Não foi possível gerar um novo convite.', 409, 'INVITE_COLLISION');
}

export async function listLeagueMembers(reference: string, userId: string) {
  const league = await requireLeague(prisma, reference, { id: true });
  const actor = await requireMembership(prisma, league.id, userId);
  const isAdmin = ADMIN_ROLES.has(actor.role);
  const members = await prisma.leagueMember.findMany({
    where: { leagueId: league.id, ...ACTIVE_MEMBER },
    orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
    select: {
      userId: true,
      role: true,
      points: true,
      joinedAt: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          streak: true,
          misses: true,
        },
      },
    },
  });
  const ranked = rankMembers(
    members.map((member) => ({
      ...member,
      user: { name: member.user.name, image: member.user.image },
    })),
  );

  return members.map((member, index) => ({
    id: member.userId,
    name: member.user.name || 'Usuário',
    email: isAdmin ? member.user.email : undefined,
    image: member.user.image,
    points: member.points,
    rank: ranked[index].rank,
    streak: member.user.streak,
    misses: member.user.misses,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
}

export async function changeMemberRole(
  reference: string,
  userId: string,
  targetUserId: string,
  role: 'subadmin' | 'member',
) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference, { id: true });
    await requireOwner(tx, league.id, userId);
    if (targetUserId === userId) {
      serviceError(
        'Use a transferência de propriedade para alterar o dono.',
        409,
        'TRANSFER_REQUIRED',
      );
    }
    const target = await requireMembership(tx, league.id, targetUserId);
    if (target.role === 'owner') {
      serviceError('O dono não pode ter o cargo alterado.', 409, 'OWNER_PROTECTED');
    }

    return tx.leagueMember.update({
      where: { id: target.id },
      data: { role },
      select: { userId: true, role: true },
    });
  });
}

export async function removeLeagueMember(
  reference: string,
  userId: string,
  targetUserId: string,
) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference, { id: true });
    const actor = await requireAdmin(tx, league.id, userId);
    const target = await requireMembership(tx, league.id, targetUserId);

    if (target.role === 'owner') {
      serviceError('O dono não pode ser removido.', 409, 'OWNER_PROTECTED');
    }
    if (actor.role === 'subadmin' && target.role !== 'member') {
      serviceError(
        'Subadministradores só podem remover membros comuns.',
        403,
        'INSUFFICIENT_ROLE',
      );
    }

    await tx.leagueMember.delete({ where: { id: target.id } });
    await tx.leagueJoinRequest.deleteMany({
      where: { leagueId: league.id, userId: targetUserId },
    });
    return { success: true };
  });
}

export async function transferLeagueOwnership(
  reference: string,
  userId: string,
  targetUserId: string,
) {
  return serializable(async (tx) => {
    const league = await requireLeague(tx, reference, {
      id: true,
      ownerId: true,
    });
    await requireOwner(tx, league.id, userId);
    if (targetUserId === userId) {
      serviceError('Você já é o dono deste bolão.', 409, 'ALREADY_OWNER');
    }
    const target = await requireMembership(tx, league.id, targetUserId);

    await tx.league.update({
      where: { id: league.id },
      data: { ownerId: targetUserId },
    });
    await tx.leagueMember.update({
      where: { id: target.id },
      data: { role: 'owner' },
    });
    await tx.leagueMember.update({
      where: { leagueId_userId: { leagueId: league.id, userId } },
      data: { role: 'subadmin' },
    });

    return {
      success: true,
      ownerId: targetUserId,
      previousOwnerId: userId,
      previousOwnerRole: 'subadmin',
    };
  });
}

function nextPublicationLabel(league: {
  status: string;
  groupPublicationMode: string;
  knockoutPublicationMode: string;
}) {
  if (league.status !== 'active') return null;
  if (
    league.groupPublicationMode === 'manual' ||
    league.knockoutPublicationMode === 'manual'
  ) {
    return 'manual';
  }
  return {
    group: league.groupPublicationMode,
    knockout: league.knockoutPublicationMode,
  };
}

export async function getLeagueRanking(reference: string, userId?: string) {
  const league = await requireLeague(prisma, reference, {
    id: true,
    slug: true,
    name: true,
    visibility: true,
    status: true,
    groupPublicationMode: true,
    knockoutPublicationMode: true,
    lastPublishedAt: true,
  });
  const membership = userId
    ? await prisma.leagueMember.findFirst({
        where: { leagueId: league.id, userId, ...ACTIVE_MEMBER },
      })
    : null;
  if (league.visibility === 'private' && !membership) {
    serviceError('Acesso negado ao ranking.', 403, 'MEMBERSHIP_REQUIRED');
  }

  const limit = !userId && league.visibility === 'public' ? 5 : undefined;
  const [members, pendingCount, latestCycle] = await prisma.$transaction([
    prisma.leagueMember.findMany({
      where: { leagueId: league.id, ...ACTIVE_MEMBER },
      orderBy: [{ points: 'desc' }, { joinedAt: 'asc' }, { userId: 'asc' }],
      take: limit,
      select: {
        userId: true,
        points: true,
        joinedAt: true,
        user: { select: { name: true, image: true } },
      },
    }),
    prisma.leaguePointEntry.count({
      where: { leagueId: league.id, status: 'pending' },
    }),
    prisma.leagueRankingCycle.findFirst({
      where: { leagueId: league.id, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: { key: true, publishedAt: true },
    }),
  ]);

  return {
    league: {
      id: league.id,
      slug: league.slug,
      name: league.name,
      status: league.status,
    },
    ranking: rankMembers(members),
    publication: {
      lastPublishedAt: league.lastPublishedAt,
      latestCycle,
      nextExpected: nextPublicationLabel(league),
      hasPendingPoints: pendingCount > 0,
    },
    limited: limit !== undefined,
  };
}

export function parseMemberRole(value: unknown): 'subadmin' | 'member' {
  if (value === 'subadmin' || value === 'member') return value;
  serviceError('Cargo de membro inválido.', 400, 'VALIDATION_ERROR', 'role');
}

export function validateLeagueUpdateInput(input: Record<string, unknown>) {
  if (
    input.visibility !== undefined &&
    !isOneOf(input.visibility, LEAGUE_VISIBILITIES)
  ) {
    serviceError('Visibilidade inválida.', 400, 'VALIDATION_ERROR', 'visibility');
  }
  if (
    input.joinPolicy !== undefined &&
    !isOneOf(input.joinPolicy, LEAGUE_JOIN_POLICIES)
  ) {
    serviceError('Política de entrada inválida.', 400, 'VALIDATION_ERROR', 'joinPolicy');
  }
  if (
    input.groupPublicationMode !== undefined &&
    !isOneOf(input.groupPublicationMode, GROUP_PUBLICATION_MODES)
  ) {
    serviceError(
      'Modo de publicação da fase de grupos inválido.',
      400,
      'VALIDATION_ERROR',
      'groupPublicationMode',
    );
  }
  if (
    input.knockoutPublicationMode !== undefined &&
    !isOneOf(input.knockoutPublicationMode, KNOCKOUT_PUBLICATION_MODES)
  ) {
    serviceError(
      'Modo de publicação do mata-mata inválido.',
      400,
      'VALIDATION_ERROR',
      'knockoutPublicationMode',
    );
  }
  return input;
}
