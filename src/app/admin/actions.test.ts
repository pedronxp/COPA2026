import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireAdminPage,
  resetAdminUserPoolScore,
  updateAdminLeagueRules,
  revalidatePath,
} = vi.hoisted(() => ({
  requireAdminPage: vi.fn(),
  resetAdminUserPoolScore: vi.fn(),
  updateAdminLeagueRules: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/admin-auth', () => ({ requireAdminPage }));
vi.mock('@/lib/admin-pool-governance-service', () => ({
  deleteAdminOptionalScoringRules: vi.fn(),
  recomputeAdminLeagueScoring: vi.fn(),
  removeAdminLeagueMember: vi.fn(),
  resetAdminUserPoolScore,
  updateAdminLeagueRules,
}));
vi.mock('@/lib/admin-service', () => ({
  configureAdminSync: vi.fn(),
  correctAdminMatch: vi.fn(),
  decidePasswordResetRequest: vi.fn(),
  deleteAdminLeague: vi.fn(),
  deleteUsersBatch: vi.fn(),
  moderateUser: vi.fn(),
  triggerAdminSync: vi.fn(),
  updateAdminLeague: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));

import { resetPoolScoreAction, updateLeagueRulesAction } from './actions';

describe('admin actions governance authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminPage.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
    });
  });

  it('authorizes score reset with league management permission', async () => {
    const formData = new FormData();
    formData.set('leagueId', 'global');
    formData.set('targetUserId', 'user-1');
    formData.set('reason', 'Correcao manual');

    await resetPoolScoreAction(formData);

    expect(requireAdminPage).toHaveBeenCalledWith('leagues:manage');
    expect(resetAdminUserPoolScore).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueId: 'global',
        targetUserId: 'user-1',
      }),
    );
  });

  it('authorizes rule edits with league management permission', async () => {
    const formData = new FormData();
    formData.set('leagueId', 'global');
    formData.set('reason', 'Ajuste de regra');
    formData.set('impactMode', 'future_only');
    formData.set('scoringPreset', 'custom');
    formData.set('scoringStartMatchday', '1');
    formData.set('groupPublicationMode', 'match');
    formData.set('knockoutPublicationMode', 'match');
    formData.set('windowHours', '48');
    formData.set('maxEdits', '3');
    formData.set('pointsExact', '5');
    formData.set('pointsDiff', '3');
    formData.set('pointsWinner', '2');
    formData.set('pointsWinnerHome', '2');
    formData.set('pointsWinnerAway', '2');
    formData.set('pointsDraw', '2');
    formData.set('pointsBothScoreYes', '0');
    formData.set('pointsBothScoreNo', '0');

    await updateLeagueRulesAction(formData);

    expect(requireAdminPage).toHaveBeenCalledWith('leagues:manage');
    expect(updateAdminLeagueRules).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueId: 'global',
        impactMode: 'future_only',
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith('/admin/leagues');
  });
});
