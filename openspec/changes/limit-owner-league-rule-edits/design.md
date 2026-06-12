## Context

League owners can currently update league metadata and, before predictions exist, competitive rules through the same league update service. The current lock is based on prediction activity, not on a product allowance that lets the owner use one post-creation correction and then blocks further owner edits.

The codebase also contains broken Portuguese text such as `NÃ£o`, `UsuÃ¡rio`, and `BolÃ£o`, indicating an encoding/copy quality problem in user-facing surfaces. This change treats Portuguese quality as part of the user experience, not a cosmetic afterthought.

## Goals / Non-Goals

**Goals:**
- Allow the owner to edit league name and rules exactly once after creation.
- Show a confirmation modal before consuming the one allowed edit.
- Persist the consumed state, timestamp, and actor for reliable enforcement.
- Show a locked/cadeado state and clear Brazilian Portuguese message after the allowance is consumed.
- Preserve existing prediction-based competitive rule lock behavior.
- Normalize affected user-facing copy to Brazilian Portuguese with correct accents, spelling, and symbols.

**Non-Goals:**
- Allow repeated owner edits through support exceptions.
- Change platform Admin powers or Admin audit rules.
- Add a full copy-management/i18n framework.
- Rewrite the league creation flow beyond copy corrections and reuse of existing rule controls.

## Decisions

### Track owner edit usage on `League`

Add nullable fields to `League` such as `ownerEditUsedAt` and `ownerEditUsedById`. The owner edit is available when `ownerEditUsedAt` is null and normal rule lock conditions still allow the requested change.

Alternative considered: infer edit usage from audit logs. Audit logs are useful history, but they are not a strong enforcement primitive and can make queries slower or ambiguous.

### Consume the allowance transactionally

The owner edit service will update the league and set `ownerEditUsedAt` in one transaction. A concurrent second edit should fail because the update condition requires the allowance to still be unused.

Alternative considered: check then update in separate calls. That is easier, but it can race if the owner submits twice.

### Keep Admin governance separate

Platform Admin tools introduced by `admin-manage-pools-scoring-rules` remain governed by admin permissions and audit logs. The one-time edit limit applies to owner-facing league management only.

Alternative considered: share the same limit for admins. That would reduce support capability and conflict with the Admin panel requirements.

### Modal is a required client-side confirmation

The UI will open a modal when an eligible owner clicks edit. The modal copy will explain that the edit can be used only once, that saved changes consume the allowance, and that later edits are locked. The server remains the source of truth, so bypassing the modal cannot bypass the limit.

Alternative considered: inline warning only. A modal is more explicit for a one-time destructive/irreversible allowance.

### Fix copy as UTF-8 Brazilian Portuguese

Affected source files should contain real UTF-8 Portuguese strings, not mojibake. Tests should include representative text assertions or snapshots where practical, and lint/build should confirm source files compile with the corrected strings.

Alternative considered: leave existing broken text for later cleanup. The user specifically called this out as a product problem, so the proposal includes it in scope.

## Risks / Trade-offs

- [Risk] A migration is required for the new league edit-tracking fields -> Mitigation: nullable fields with no backfill required; existing leagues start with one available owner edit unless product decides otherwise.
- [Risk] Owners may expect unlimited typo fixes -> Mitigation: modal copy must be explicit and the locked state must explain that Admin support can still govern exceptional cases.
- [Risk] Existing prediction lock and one-time edit lock can conflict -> Mitigation: show the stricter reason when rules are blocked and keep safe name edits subject to the one-time allowance.
- [Risk] Copy cleanup can touch many files -> Mitigation: focus on affected league/admin flows first and avoid unrelated redesign.

## Migration Plan

1. Add nullable edit-tracking fields to `League`.
2. Generate and apply Prisma migration.
3. Update league projections to expose owner edit availability and lock reason.
4. Update owner-facing update service and UI.
5. Normalize affected Portuguese strings and verify build/tests.

Rollback removes the UI and service usage of the fields while leaving nullable database columns harmless until a cleanup migration is chosen.

## Open Questions

- Should existing leagues created before this change receive one available edit by default? The proposed default is yes because the tracking field starts null.
- Should editing only the group name consume the same one-time allowance as editing rules? The proposed behavior is yes because the user requested changing name and rules as one controlled edit.
