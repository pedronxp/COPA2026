import {
  GROUP_PUBLICATION_MODES,
  KNOCKOUT_PUBLICATION_MODES,
  SCORING_PRESETS,
  validateScoringRules,
  isOneOf,
  type LeagueScoringRules,
} from '@/lib/league-domain';

export type AdminRuleImpactMode = 'future_only' | 'recompute_scored';

export interface AdminLeagueRuleInput extends LeagueScoringRules {
  scoringPreset: keyof typeof SCORING_PRESETS;
  scoringStartMatchday: number;
  groupPublicationMode: (typeof GROUP_PUBLICATION_MODES)[number];
  knockoutPublicationMode: (typeof KNOCKOUT_PUBLICATION_MODES)[number];
}

export const OPTIONAL_SCORING_RULE_FIELDS = [
  'pointsBothScoreYes',
  'pointsBothScoreNo',
] as const;

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  field: string,
) {
  const parsed = value === undefined || value === '' ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${field} deve estar entre ${minimum} e ${maximum}.`);
  }
  return parsed;
}

export function parseAdminRuleImpactMode(value: unknown): AdminRuleImpactMode {
  if (value === 'future_only' || value === 'recompute_scored') return value;
  throw new Error('Modo de impacto invalido.');
}

export function parseAdminLeagueRules(
  input: Record<string, unknown>,
  fallback: AdminLeagueRuleInput,
): AdminLeagueRuleInput {
  let scoringPreset =
    typeof input.scoringPreset === 'string' && input.scoringPreset in SCORING_PRESETS
      ? (input.scoringPreset as keyof typeof SCORING_PRESETS)
      : fallback.scoringPreset;
  const scoringFallback =
    scoringPreset === fallback.scoringPreset
      ? fallback
      : SCORING_PRESETS[scoringPreset].rules;
  const rules = validateScoringRules(input, scoringFallback);

  if (scoringPreset !== 'custom') {
    const presetDefaultRules = SCORING_PRESETS[scoringPreset].rules;
    const isDifferent = (Object.keys(presetDefaultRules) as Array<keyof LeagueScoringRules>).some(
      (key) => rules[key] !== presetDefaultRules[key]
    );
    if (isDifferent) {
      scoringPreset = 'custom';
    }
  }

  return {
    ...rules,
    scoringPreset,
    scoringStartMatchday: boundedInteger(
      input.scoringStartMatchday,
      fallback.scoringStartMatchday,
      1,
      99,
      'scoringStartMatchday',
    ),
    groupPublicationMode: isOneOf(input.groupPublicationMode, GROUP_PUBLICATION_MODES)
      ? input.groupPublicationMode
      : fallback.groupPublicationMode,
    knockoutPublicationMode: isOneOf(
      input.knockoutPublicationMode,
      KNOCKOUT_PUBLICATION_MODES,
    )
      ? input.knockoutPublicationMode
      : fallback.knockoutPublicationMode,
  };
}

export function disableOptionalScoringRules(
  rules: AdminLeagueRuleInput,
): AdminLeagueRuleInput {
  return {
    ...rules,
    scoringPreset: 'custom',
    pointsBothScoreYes: 0,
    pointsBothScoreNo: 0,
  };
}

export function diffAdminLeagueRules(
  before: AdminLeagueRuleInput,
  after: AdminLeagueRuleInput,
) {
  return (Object.keys(after) as Array<keyof AdminLeagueRuleInput>).filter(
    (field) => before[field] !== after[field],
  );
}
