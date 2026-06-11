## Why

The application already has sensitive operational flows for password reset approvals, league rules, score synchronization, and member management, but they are scattered across APIs or owner-only surfaces. A dedicated admin operations panel will give trusted staff one secure place to monitor the product, handle support requests, moderate users, manage leagues, and audit risky changes.

## What Changes

- Add a protected `/admin` area for platform operators with overview metrics, pending work, and operational health.
- Introduce platform-level admin roles and permission checks separate from league owner/subadmin roles.
- Add user moderation capabilities including block, suspension, ban, session revocation, and forced password review states.
- Add admin-facing password reset request management with approval/rejection context and status filtering.
- Add global league administration for renaming leagues, changing lifecycle/status, transferring ownership support, and viewing rule/member risk signals.
- Add API and match operations views for sync health, recent sync logs, score/manual status controls, and recalculation entry points.
- Add configurable automatic API synchronization with durable schedule state, failure/degraded telemetry, and a protected cron entry point.
- Convert API match wall-clock times with the IANA time zone of each stadium so Brazilian display times remain correct.
- Add protected bulk user deletion with one required reason, audit metadata, and safeguards for admins, system accounts, self-deletion, and league owners.
- Add audit logging for privileged actions such as password reset approval, user sanctions, league edits, score changes, sync triggers, and rules changes.
- Add a configurable operations surface for default rules/presets that can be applied safely to future leagues.

## Capabilities

### New Capabilities

- `admin-access-control`: Platform admin roles, permission gates, protected admin routes, and safe denial behavior.
- `admin-operations-dashboard`: Admin overview, operational queue counts, league/user/match metrics, and API sync health.
- `admin-password-reset-queue`: Password reset request listing, filtering, approval, rejection, and audit metadata.
- `admin-user-moderation`: User search, profile inspection, block/suspend/ban states, protected batch deletion, session revocation, and moderation history.
- `admin-league-operations`: Global league search, rename/status controls, owner support, member risk review, and rule visibility.
- `admin-match-api-operations`: Sync log inspection, manual and scheduled sync, source health telemetry, venue-aware kickoff conversion, match status/score correction, and scoring recalculation controls.
- `admin-audit-log`: Immutable administrative event recording and searchable review surfaces.

### Modified Capabilities

- None. Existing league/auth flows remain compatible; this change adds platform-level operations on top.

## Impact

- Database schema: users need platform admin/moderation fields; new audit log records are required; password reset requests should capture reviewer metadata; sessions may need revocation support.
- Server authorization: operational secret checks should be complemented by authenticated admin-role checks for browser-facing admin operations.
- New UI routes/components under `/admin`, with server-side data fetching and client/server mutations protected by authorization.
- API route handlers for admin summaries, user moderation, league operations, reset queue decisions, match operations, sync operations, and audit browsing.
- Existing sensitive endpoints such as password reset management, sync, match score updates, and league edits must remain compatible while using the shared admin authorization boundary where applicable.
- Verification includes OpenSpec validation, Prisma generation, unit tests for permission/moderation helpers, lint, and production build.
