## 1. Service Contracts

- [x] 1.1 Add admin service queries for bolao detail data, including rules, members, point-entry counts, and recent audit events.
- [x] 1.2 Add admin rule validation helpers that reuse league-domain scoring ranges and distinguish optional bonus deletion from required rule replacement.
- [x] 1.3 Add an admin rule update service with required reason, impact mode, before/after audit metadata, and special handling for bolao id `global`.
- [x] 1.4 Add recomputation support for processed predictions in a selected bolao, updating global `User` aggregates or custom `LeagueMember` aggregates as appropriate.
- [x] 1.5 Add admin score reset services for principal bolao users and custom bolao memberships.
- [x] 1.6 Add an admin member removal service that rejects principal bolao removal, owner removal, and missing memberships while preserving the user account.

## 2. Server Actions and Routing

- [x] 2.1 Add Server Actions for rule edits, optional rule deletion, score reset, recompute scoring, and member removal behind `leagues:manage` authorization.
- [x] 2.2 Revalidate affected admin, league, leaderboard, dashboard, and profile paths after successful governance mutations.
- [x] 2.3 Add an admin bolao detail route reachable from `/admin/leagues` for each listed bolao.

## 3. Admin UI

- [x] 3.1 Update `/admin/leagues` rows with a clear action to open bolao governance details.
- [x] 3.2 Build the bolao detail view with rule summary, lock state, point-entry summary, member standings, and recent audit history.
- [x] 3.3 Build rule-edit controls with validated numeric fields, impact-mode selection, reason input, and disabled deletion affordances for required rules.
- [x] 3.4 Build member score reset and remove-from-bolao controls with destructive-action separation and required reasons.
- [x] 3.5 Clearly label the principal bolao and prevent delete or membership-removal actions that do not apply to it.

## 4. Tests and Verification

- [x] 4.1 Add unit tests for rule validation, optional rule deletion, and admin service guardrails.
- [x] 4.2 Add service tests for global score reset, custom bolao score reset, member removal, future-only rule edits, and recompute rule edits.
- [x] 4.3 Add UI or integration coverage for authorized and unauthorized governance action paths.
- [x] 4.4 Run lint, typecheck/build, relevant tests, and OpenSpec validation for `admin-manage-pools-scoring-rules`.
