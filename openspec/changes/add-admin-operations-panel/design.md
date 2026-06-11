## Context

The app uses Next.js App Router, Prisma/Postgres, custom cookie-backed sessions, and route handlers for mutations. Current operational behavior exists in isolated places: password reset requests can be approved through an operational endpoint, sync and match score updates are guarded by an operations secret, and league owners/subadmins can manage their own leagues. There is no platform-level admin role, no central admin UI, and no durable audit trail for sensitive actions.

The admin panel must sit above league-level permissions. League owners manage their own communities; platform admins manage the integrity, support, and operations of the whole product.

## Goals / Non-Goals

**Goals:**

- Add a protected admin area with first-class platform permissions.
- Give admins one place to inspect user, league, match, sync, reset, and audit state.
- Ensure every privileged mutation performs server-side authorization and records an audit event.
- Keep the existing player and league experiences compatible.
- Make the first implementation useful as an operations cockpit, even if future releases add deeper workflow polish.

**Non-Goals:**

- Replacing league owner/subadmin permissions.
- Adding a third-party admin framework or auth provider.
- Deleting users or leagues permanently from the admin UI.
- Building external notification delivery for support workflows.
- Creating a full custom rules engine beyond the existing league scoring fields.

## Decisions

### Decision: Add platform roles to `User`

Admins will be represented by `adminRole` on `User` with values such as `none`, `support`, `moderator`, `operator`, and `super_admin`. User account moderation will use separate fields (`accountStatus`, `suspendedUntil`, `moderationReason`) so permission and sanction state do not get mixed.

Alternative considered: create a separate `AdminUser` table. That keeps user rows smaller, but most admin authorization checks need the session user and one user lookup anyway. A `User` field is simpler and fits the current auth model.

### Decision: Centralize admin authorization in a server-only service

Admin pages, route handlers, and server actions will call the same admin authorization helper. The helper returns the current user plus role checks, and denies access with consistent 401/403 behavior.

Alternative considered: rely on UI-only hiding or the existing operations secret. UI hiding is not security, and the operations secret is appropriate for machine-to-machine operations but awkward for browser admin workflows.

### Decision: Record audit events for every privileged mutation

The app will add an `AdminAuditLog` model containing actor, action, entity type/id, summary, metadata, and timestamp. Audit logs are append-only from the application perspective and are shown in `/admin`.

Alternative considered: log to stdout only. That helps debugging but does not support later review, moderation disputes, or operational accountability.

### Decision: Use server-rendered admin pages with focused forms

The admin UI will be mostly server-rendered pages with small POST route handlers or server actions for mutations, matching the current App Router patterns. This keeps sensitive data fetching on the server and avoids introducing a client state framework.

Alternative considered: one large client-side admin app calling many APIs. That can become more interactive later, but it increases initial surface area and makes authorization mistakes easier.

### Decision: First release covers broad operations, not every deep edit

The first implementation will include dashboard metrics, queues, user sanctions, league renaming/status changes, sync health, match score/status correction, and audit browsing. More destructive or rare operations can be added behind the same permission/audit foundation later.

Alternative considered: implement only one deep workflow, such as password reset. That would leave the main need, a complete administrative cockpit, unsolved.

## Risks / Trade-offs

- Admin role bootstrap problem -> allow seeding or direct database assignment for the first super admin; document the field and keep default `none`.
- Overly broad admin access -> split roles by permission and keep the UI/server checks aligned through one helper.
- Score corrections can alter rankings unexpectedly -> require operator/super-admin permission, audit metadata, and reuse existing scoring services.
- Ban/suspension state can drift if login and mutation paths ignore it -> enforce status in login/session-sensitive mutation boundaries where feasible in this change.
- Large UI surface can regress responsive layouts -> keep admin styling scoped and utilitarian, with dense tables and stable controls.

## Migration Plan

1. Add Prisma fields/models for admin roles, moderation status, reset reviewers, session revocation, and audit logs.
2. Generate Prisma client and add reusable admin permission/audit services.
3. Add admin data services and mutation handlers.
4. Build `/admin` pages for dashboard, resets, users, leagues, matches/API, and audit.
5. Update sensitive existing endpoints to use admin checks where browser admin access is needed, while preserving operations-secret compatibility for machine calls.
6. Add focused tests for admin authorization, moderation state, and audit logging.
7. Run lint, tests, build, and OpenSpec validation.

Rollback strategy: leave new fields nullable/defaulted and route the admin UI behind role checks. If needed, remove links to `/admin` while preserving existing player/league behavior.

## Open Questions

- Which real account should receive the first `super_admin` role in production?
- Should future support workflows notify users by email when a request is approved, rejected, or a sanction changes?
- Should match corrections require a second approver once real tournament stakes are high?
