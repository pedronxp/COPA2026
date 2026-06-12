## Why

Admins can already operate users and leagues, but they still lack a focused way to inspect each bolao's rules, member scores, and corrective actions from one place. When a scoring rule, member score, or mistaken participant needs correction, admins need audited controls that distinguish the global default bolao from custom league standings.

## What Changes

- Add an admin bolao detail view for inspecting league identity, owner, members, current scoring rules, lock state, publication mode, and operational history.
- Let authorized admins edit scoring and prediction rules for leagues, including the principal/global bolao that users land in by default.
- Let authorized admins delete scoring rules by clearing optional rule bonuses while preserving required base scoring fields with validated defaults.
- Let authorized admins reset a user's score in the principal/global bolao and in a selected bolao membership, including related streak and pending-point fields where applicable.
- Let authorized admins remove a specific user from a selected bolao when the user is eligible and the action is not deleting the user's platform account.
- Record every privileged correction, reset, rule edit, rule deletion, and member removal in the admin audit log with before/after metadata and a required reason.

## Capabilities

### New Capabilities
- `admin-pool-governance`: Admin inspection and corrective management for bolao rules, member scores, global scoring, and bolao membership.

### Modified Capabilities
- None.

## Impact

- Affected UI: `src/app/admin/leagues/**`, `src/app/admin/users/**`, `src/components/admin/**`, and shared admin styling.
- Affected services/actions: `src/app/admin/actions.ts`, `src/lib/admin-service.ts`, `src/lib/league-service.ts`, `src/lib/scoring-service.ts`, and admin authorization/audit helpers.
- Affected data: `League` scoring fields, `LeagueMember` score and streak fields, `User` global score and streak fields, `LeaguePointEntry` correction history, and `AdminAuditLog` metadata.
- No new third-party dependencies are expected.
