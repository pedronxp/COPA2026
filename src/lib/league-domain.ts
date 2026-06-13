export const LEAGUE_VISIBILITIES = ['public', 'private'] as const;
export const LEAGUE_JOIN_POLICIES = ['open', 'approval', 'invite'] as const;
export const LEAGUE_STATUSES = ['draft', 'active', 'closed', 'archived'] as const;
export const LEAGUE_ROLES = ['owner', 'subadmin', 'member'] as const;
export const GROUP_PUBLICATION_MODES = [
  'match',
  'round',
  'every_2_rounds',
  'every_3_rounds',
  'phase',
  'manual',
] as const;
export const KNOCKOUT_PUBLICATION_MODES = ['match', 'stage', 'manual'] as const;
export const LEAGUE_VISUAL_THEMES = ['pulse', 'stadium', 'classic'] as const;
export const COMPETITIVE_LEAGUE_FIELDS = [
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
  'pointsBothScoreYes',
  'pointsBothScoreNo',
] as const;

export type LeagueVisibility = (typeof LEAGUE_VISIBILITIES)[number];
export type LeagueJoinPolicy = (typeof LEAGUE_JOIN_POLICIES)[number];
export type LeagueStatus = (typeof LEAGUE_STATUSES)[number];
export type LeagueRole = (typeof LEAGUE_ROLES)[number];
export type GroupPublicationMode = (typeof GROUP_PUBLICATION_MODES)[number];
export type KnockoutPublicationMode = (typeof KNOCKOUT_PUBLICATION_MODES)[number];
export type LeagueVisualTheme = (typeof LEAGUE_VISUAL_THEMES)[number];
export type CompetitiveLeagueField = (typeof COMPETITIVE_LEAGUE_FIELDS)[number];
export type OwnerEditLockReason = 'used' | 'rules_locked';

export interface LeagueScoringRules {
  windowHours: number;
  maxEdits: number;
  pointsExact: number;
  pointsDiff: number;
  pointsWinner: number;
  pointsWinnerHome: number;
  pointsWinnerAway: number;
  pointsDraw: number;
  pointsBothScoreYes: number;
  pointsBothScoreNo: number;
}

export interface OwnerEditState {
  available: boolean;
  usedAt: Date | null;
  usedById: string | null;
  rulesLocked: boolean;
  lockReason: OwnerEditLockReason | null;
  lockMessage: string | null;
}

const COMPETITIVE_LEAGUE_FIELD_SET = new Set<string>(COMPETITIVE_LEAGUE_FIELDS);

export function isCompetitiveLeagueField(field: string): field is CompetitiveLeagueField {
  return COMPETITIVE_LEAGUE_FIELD_SET.has(field);
}

function valuesDiffer(currentValue: unknown, nextValue: unknown) {
  if (currentValue instanceof Date && nextValue instanceof Date) {
    return currentValue.getTime() !== nextValue.getTime();
  }
  return currentValue !== nextValue;
}

export function hasCompetitiveLeagueChange(
  input: Record<string, unknown>,
  current: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  return Object.keys(input).some((field) => {
    if (!isCompetitiveLeagueField(field) || input[field] === undefined) {
      return false;
    }
    return valuesDiffer(current[field], next[field]);
  });
}

export function deriveOwnerEditState(input: {
  ownerEditUsedAt: Date | null;
  ownerEditUsedById: string | null;
  rulesLockedAt?: Date | null;
  hasPredictions?: boolean;
  requestedCompetitiveChange?: boolean;
}): OwnerEditState {
  return {
    available: true,
    usedAt: null,
    usedById: null,
    rulesLocked: false,
    lockReason: null,
    lockMessage: null,
  };
}

export const SCORING_PRESETS = {
  standard: {
    label: 'Copa dos Crias padrão',
    description: 'Equilíbrio entre placar exato, saldo e vencedor.',
    rules: {
      windowHours: 48,
      maxEdits: 3,
      pointsExact: 5,
      pointsDiff: 3,
      pointsWinner: 2,
      pointsWinnerHome: 2,
      pointsWinnerAway: 2,
      pointsDraw: 2,
      pointsBothScoreYes: 1,
      pointsBothScoreNo: 1,
    },
  },
  casual: {
    label: 'Casual',
    description: 'Mais liberdade para editar, mantendo pontuação simples.',
    rules: {
      windowHours: 72,
      maxEdits: 999,
      pointsExact: 4,
      pointsDiff: 3,
      pointsWinner: 2,
      pointsWinnerHome: 2,
      pointsWinnerAway: 2,
      pointsDraw: 2,
      pointsBothScoreYes: 1,
      pointsBothScoreNo: 1,
    },
  },
  exact: {
    label: 'Foco no placar exato',
    description: 'Premia mais quem acerta o resultado completo.',
    rules: {
      windowHours: 48,
      maxEdits: 3,
      pointsExact: 8,
      pointsDiff: 3,
      pointsWinner: 1,
      pointsWinnerHome: 1,
      pointsWinnerAway: 1,
      pointsDraw: 2,
      pointsBothScoreYes: 2,
      pointsBothScoreNo: 2,
    },
  },
  custom: {
    label: 'Personalizado',
    description: 'Defina cada valor e limite do bolão.',
    rules: {
      windowHours: 48,
      maxEdits: 3,
      pointsExact: 5,
      pointsDiff: 3,
      pointsWinner: 2,
      pointsWinnerHome: 2,
      pointsWinnerAway: 2,
      pointsDraw: 2,
      pointsBothScoreYes: 1,
      pointsBothScoreNo: 1,
    },
  },
} as const;

export type ScoringPreset = keyof typeof SCORING_PRESETS;

export class LeagueValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'LeagueValidationError';
  }
}

export function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return typeof value === 'string' && allowed.includes(value);
}

export function createLeagueSlug(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);

  return slug || 'bolao';
}

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  field: string,
) {
  const parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new LeagueValidationError(
      `${field} deve estar entre ${minimum} e ${maximum}.`,
      field,
    );
  }
  return parsed;
}

export function validateScoringRules(
  input: Partial<Record<keyof LeagueScoringRules, unknown>>,
  fallback: LeagueScoringRules = SCORING_PRESETS.standard.rules,
): LeagueScoringRules {
  return {
    windowHours: boundedInteger(input.windowHours, fallback.windowHours, 1, 168, 'windowHours'),
    maxEdits: boundedInteger(input.maxEdits, fallback.maxEdits, 0, 999, 'maxEdits'),
    pointsExact: boundedInteger(input.pointsExact, fallback.pointsExact, 0, 100, 'pointsExact'),
    pointsDiff: boundedInteger(input.pointsDiff, fallback.pointsDiff, 0, 100, 'pointsDiff'),
    pointsWinner: boundedInteger(input.pointsWinner, fallback.pointsWinner, 0, 100, 'pointsWinner'),
    pointsWinnerHome: boundedInteger(input.pointsWinnerHome, fallback.pointsWinnerHome ?? fallback.pointsWinner, 0, 100, 'pointsWinnerHome'),
    pointsWinnerAway: boundedInteger(input.pointsWinnerAway, fallback.pointsWinnerAway ?? fallback.pointsWinner, 0, 100, 'pointsWinnerAway'),
    pointsDraw: boundedInteger(input.pointsDraw, fallback.pointsDraw, 0, 100, 'pointsDraw'),
    pointsBothScoreYes: boundedInteger(
      input.pointsBothScoreYes,
      fallback.pointsBothScoreYes,
      0,
      100,
      'pointsBothScoreYes',
    ),
    pointsBothScoreNo: boundedInteger(
      input.pointsBothScoreNo,
      fallback.pointsBothScoreNo,
      0,
      100,
      'pointsBothScoreNo',
    ),
  };
}

export function validateLeagueConfiguration(input: Record<string, unknown>) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 3 || name.length > 80) {
    throw new LeagueValidationError('O nome deve ter entre 3 e 80 caracteres.', 'name');
  }

  const description =
    typeof input.description === 'string' ? input.description.trim().slice(0, 400) : '';
  const visibility = isOneOf(input.visibility, LEAGUE_VISIBILITIES)
    ? input.visibility
    : 'private';
  const joinPolicy = isOneOf(input.joinPolicy, LEAGUE_JOIN_POLICIES)
    ? input.joinPolicy
    : visibility === 'public'
      ? 'open'
      : 'invite';
  const visualTheme = isOneOf(input.visualTheme, LEAGUE_VISUAL_THEMES)
    ? input.visualTheme
    : 'pulse';
  let scoringPreset =
    typeof input.scoringPreset === 'string' && input.scoringPreset in SCORING_PRESETS
      ? (input.scoringPreset as ScoringPreset)
      : 'standard';
  const presetRules = SCORING_PRESETS[scoringPreset].rules;
  const rules = validateScoringRules(input, presetRules);

  if (scoringPreset !== 'custom') {
    const presetDefaultRules = SCORING_PRESETS[scoringPreset].rules;
    const isDifferent = (Object.keys(presetDefaultRules) as Array<keyof LeagueScoringRules>).some(
      (key) => rules[key] !== presetDefaultRules[key]
    );
    if (isDifferent) {
      scoringPreset = 'custom';
    }
  }
  const groupPublicationMode = isOneOf(input.groupPublicationMode, GROUP_PUBLICATION_MODES)
    ? input.groupPublicationMode
    : 'match';
  const knockoutPublicationMode = isOneOf(
    input.knockoutPublicationMode,
    KNOCKOUT_PUBLICATION_MODES,
  )
    ? input.knockoutPublicationMode
    : 'match';
  const expiresAt = input.expiresAt
    ? new Date(String(input.expiresAt))
    : new Date('2026-08-01T00:00:00Z');

  if (Number.isNaN(expiresAt.getTime())) {
    throw new LeagueValidationError('Data de encerramento inválida.', 'expiresAt');
  }

  return {
    name,
    description: description || null,
    requestedSlug:
      typeof input.slug === 'string' && input.slug.trim()
        ? createLeagueSlug(input.slug)
        : createLeagueSlug(name),
    visibility,
    joinPolicy,
    visualTheme,
    scoringPreset,
    status: 'active' as const,
    maxMembers: boundedInteger(input.maxMembers, 50, 2, 50, 'maxMembers'),
    scoringStartMatchday: boundedInteger(
      input.scoringStartMatchday,
      1,
      1,
      99,
      'scoringStartMatchday',
    ),
    groupPublicationMode,
    knockoutPublicationMode,
    expiresAt,
    ...rules,
  };
}

export function deriveRankingCycle(input: {
  matchId: string;
  stage: string;
  matchday: string | null;
  groupMode: GroupPublicationMode;
  knockoutMode: KnockoutPublicationMode;
}) {
  const { matchId, stage, matchday, groupMode, knockoutMode } = input;
  const round = Number.parseInt(matchday || '', 10);

  if (stage === 'group') {
    if (groupMode === 'match') return `match:${matchId}`;
    if (groupMode === 'phase') return 'group:phase';
    if (groupMode === 'manual') return 'group:manual';
    if (!Number.isInteger(round) || round < 1) return `group:unassigned:${matchId}`;
    if (groupMode === 'round') return `group:${round}`;
    const size = groupMode === 'every_2_rounds' ? 2 : 3;
    const start = Math.floor((round - 1) / size) * size + 1;
    return `group:${start}-${start + size - 1}`;
  }

  if (knockoutMode === 'match') return `match:${matchId}`;
  if (knockoutMode === 'manual') return 'knockout:manual';
  return `stage:${stage}`;
}
