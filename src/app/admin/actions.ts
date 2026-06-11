'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPage } from '@/lib/admin-auth';
import {
  correctAdminMatch,
  decidePasswordResetRequest,
  moderateUser,
  triggerAdminSync,
  updateAdminLeague,
} from '@/lib/admin-service';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function intValue(formData: FormData, key: string) {
  const value = Number(text(formData, key));
  if (!Number.isInteger(value)) throw new Error(`Valor invalido para ${key}.`);
  return value;
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

export async function triggerSyncAction() {
  const actor = await requireAdminPage('matches:operate');
  await triggerAdminSync(actor);

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
}
