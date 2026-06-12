'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPage } from '@/lib/admin-auth';
import {
  configureAdminSync,
  correctAdminMatch,
  decidePasswordResetRequest,
  deleteUsersBatch,
  moderateUser,
  triggerAdminSync,
  updateAdminLeague,
  deleteAdminLeague,
} from '@/lib/admin-service';
import {
  deleteAdminOptionalScoringRules,
  recomputeAdminLeagueScoring,
  removeAdminLeagueMember,
  resetAdminUserPoolScore,
  updateAdminLeagueRules,
} from '@/lib/admin-pool-governance-service';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function intValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  if (!Number.isInteger(value)) throw new Error(`Valor invalido para ${key}.`);
  return value;
}

function revalidateLeagueGovernance(leagueId: string, slug?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/leagues');
  revalidatePath(`/admin/leagues/${leagueId}`);
  revalidatePath('/leaderboard');
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/leagues');
  revalidatePath('/leagues/[slug]', 'page');
  if (slug) revalidatePath(`/leagues/${slug}`);
}

export async function decideResetAction(formData: FormData) {
  const actor = await requireAdminPage('resets:manage');
  const action = text(formData, 'action');

  await decidePasswordResetRequest({
    actor,
    requestId: text(formData, 'requestId'),
    action: action === 'approve' ? 'approve' : 'reject',
    reason: text(formData, 'reason'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/resets');
}

export async function moderateUserAction(formData: FormData) {
  const actor = await requireAdminPage('users:moderate');
  const accountStatus = text(formData, 'accountStatus');
  const suspendedDays = intValue(formData, 'suspendedDays');
  const suspendedUntil =
    accountStatus === 'suspended'
      ? new Date(Date.now() + Math.max(1, suspendedDays) * 24 * 60 * 60 * 1000)
      : null;

  await moderateUser({
    actor,
    targetUserId: text(formData, 'targetUserId'),
    accountStatus,
    reason: text(formData, 'reason'),
    suspendedUntil,
  });

  revalidatePath('/admin');
  revalidatePath('/admin/users');
}

export async function deleteUsersBatchAction(formData: FormData) {
  const actor = await requireAdminPage('users:moderate');
  const userIds = formData
    .getAll('userIds')
    .filter((value): value is string => typeof value === 'string');

  await deleteUsersBatch({
    actor,
    userIds,
    reason: text(formData, 'reason'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/users');
}

export async function updateLeagueAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');

  await updateAdminLeague({
    actor,
    leagueId: text(formData, 'leagueId'),
    name: text(formData, 'name'),
    status: text(formData, 'status'),
    reason: text(formData, 'reason'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/leagues');
}

export async function deleteLeagueAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');

  await deleteAdminLeague({
    actor,
    leagueId: text(formData, 'leagueId'),
    reason: text(formData, 'reason'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/leagues');
}

function leagueRuleValues(formData: FormData) {
  return {
    scoringPreset: text(formData, 'scoringPreset'),
    scoringStartMatchday: intValue(formData, 'scoringStartMatchday'),
    groupPublicationMode: text(formData, 'groupPublicationMode'),
    knockoutPublicationMode: text(formData, 'knockoutPublicationMode'),
    windowHours: intValue(formData, 'windowHours'),
    maxEdits: intValue(formData, 'maxEdits'),
    pointsExact: intValue(formData, 'pointsExact'),
    pointsDiff: intValue(formData, 'pointsDiff'),
    pointsWinner: intValue(formData, 'pointsWinner'),
    pointsWinnerHome: intValue(formData, 'pointsWinnerHome'),
    pointsWinnerAway: intValue(formData, 'pointsWinnerAway'),
    pointsDraw: intValue(formData, 'pointsDraw'),
    pointsBothScoreYes: intValue(formData, 'pointsBothScoreYes'),
    pointsBothScoreNo: intValue(formData, 'pointsBothScoreNo'),
  };
}

export async function updateLeagueRulesAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');
  const leagueId = text(formData, 'leagueId');
  const slug = text(formData, 'slug');

  await updateAdminLeagueRules({
    actor,
    leagueId,
    values: leagueRuleValues(formData),
    impactMode:
      text(formData, 'impactMode') === 'recompute_scored'
        ? 'recompute_scored'
        : 'future_only',
    reason: text(formData, 'reason'),
  });

  revalidateLeagueGovernance(leagueId, slug);
}

export async function deleteOptionalScoringRulesAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');
  const leagueId = text(formData, 'leagueId');
  const slug = text(formData, 'slug');

  await deleteAdminOptionalScoringRules({
    actor,
    leagueId,
    impactMode:
      text(formData, 'impactMode') === 'recompute_scored'
        ? 'recompute_scored'
        : 'future_only',
    reason: text(formData, 'reason'),
  });

  revalidateLeagueGovernance(leagueId, slug);
}

export async function recomputeLeagueScoringAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');
  const leagueId = text(formData, 'leagueId');
  const slug = text(formData, 'slug');

  await recomputeAdminLeagueScoring({
    actor,
    leagueId,
    reason: text(formData, 'reason'),
  });

  revalidateLeagueGovernance(leagueId, slug);
}

export async function resetPoolScoreAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');
  const leagueId = text(formData, 'leagueId');
  const slug = text(formData, 'slug');

  await resetAdminUserPoolScore({
    actor,
    leagueId,
    targetUserId: text(formData, 'targetUserId'),
    reason: text(formData, 'reason'),
  });

  revalidateLeagueGovernance(leagueId, slug);
}

export async function removeLeagueMemberAction(formData: FormData) {
  const actor = await requireAdminPage('leagues:manage');
  const leagueId = text(formData, 'leagueId');
  const slug = text(formData, 'slug');

  await removeAdminLeagueMember({
    actor,
    leagueId,
    targetUserId: text(formData, 'targetUserId'),
    reason: text(formData, 'reason'),
  });

  revalidateLeagueGovernance(leagueId, slug);
}

export async function triggerSyncAction() {
  const actor = await requireAdminPage('matches:operate');
  await triggerAdminSync(actor);

  revalidatePath('/admin');
  revalidatePath('/admin/matches');
  revalidatePath('/dashboard');
  revalidatePath('/matches');
  revalidatePath('/');
  revalidatePath('/results');
  revalidatePath('/calendar');
  revalidatePath('/leaderboard');
}

export async function configureSyncAction(formData: FormData) {
  const actor = await requireAdminPage('matches:operate');

  await configureAdminSync({
    actor,
    enabled: formData.get('enabled') === 'on',
    intervalMinutes: intValue(formData, 'intervalMinutes'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/matches');
}

export async function correctMatchAction(formData: FormData) {
  const actor = await requireAdminPage('matches:operate');

  await correctAdminMatch({
    actor,
    matchId: text(formData, 'matchId'),
    homeScore: intValue(formData, 'homeScore'),
    awayScore: intValue(formData, 'awayScore'),
    status: text(formData, 'status'),
    reason: text(formData, 'reason'),
  });

  revalidatePath('/admin');
  revalidatePath('/admin/matches');
  revalidatePath('/dashboard');
  revalidatePath('/matches');
  revalidatePath('/');
  revalidatePath('/results');
  revalidatePath('/calendar');
  revalidatePath('/leaderboard');
}
