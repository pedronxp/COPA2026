## Context

The admin area already exposes league search, basic league edits, user moderation, batch user deletion, match correction, and audit browsing. Leagues store scoring and prediction rules directly on the `League` row, while user standings are split between the global bolao and custom leagues:

- The principal bolao uses `leagueId = "global"` and mirrors published performance into `User.points`, `User.streak`, and `User.misses`.
- Custom boloes store member totals in `LeagueMember.points`, `LeagueMember.pendingPoints`, `exactScoreStreak`, and `bestExactScoreStreak`.
- Scored predictions are represented by `LeaguePointEntry` rows and may already be published or pending depending on the league publication mode.

This change adds admin-only governance around those existing records without introducing new third-party dependencies.

## Goals / Non-Goals

**Goals:**
- Give platform admins a detail view for each bolao with rules, members, score state, and corrective actions.
- Let admins edit scoring and prediction rules for the global bolao and custom boloes with validation, reason capture, and audit metadata.
- Let admins reset a user's score in the global bolao or a selected bolao membership.
- Let admins remove an eligible user from a bolao without deleting the platform user account.
- Avoid silent score drift by making rule-change impact explicit.

**Non-Goals:**
- Changing player-facing league ownership rules or member self-service flows.
- Adding a new scoring-rule table or versioned rules engine.
- Deleting platform user accounts from the bolao detail page.
- Rewriting the ranking-cycle model.

## Decisions

### Keep rules on `League`

Rule edits will update the existing `League` scoring and prediction fields through admin service functions. This matches the current data model and avoids a migration for a separate rule table.

Alternative considered: introduce `LeagueScoringRule` records that can be created and deleted. That would make historical versions cleaner, but it is larger than the requested admin workflow and would require deeper scoring-service changes.

### Represent deleted optional rules as disabled values

Optional bonuses, such as both-teams-to-score bonuses, will be "deleted" by setting their point values to `0`. Required base fields, such as exact score, difference, winner, draw, prediction window, and edit limit, cannot be physically deleted; admins can reset them to a known preset value.

Alternative considered: allow null values for rule columns. The current scoring code expects integers, so nullability would add avoidable defensive logic and migration risk.

### Require explicit rule-change impact

Admin rule edits will require an impact mode:

- `future_only`: update rules for future scoring without rewriting existing `LeaguePointEntry` rows.
- `recompute_scored`: update rules and recompute existing scored predictions for that league.

The UI will explain the current lock state and make the impact visible before submission. This avoids surprising admins when changing the principal bolao after predictions have already been processed.

Alternative considered: always recompute. That is simple conceptually, but it can surprise admins who only intend to change future matches and can create broad leaderboard movement.

### Add admin-specific correction services

New admin service functions will sit in `src/lib/admin-service.ts` or a focused helper module imported from it. They will enforce `leagues:manage` or `users:moderate` permissions at the Server Action layer, validate form input through the same league-domain ranges, write audit entries, and revalidate affected admin/player paths.

Alternative considered: reuse player-facing `updateLeague` and `removeLeagueMember` directly. Those functions enforce owner/subadmin membership semantics, while platform admins need separate authorization and richer audit context.

### Preserve historical point entries on score reset

Resetting a score will set the aggregate score fields to zero and write an admin audit event. It will not delete predictions or historical `LeaguePointEntry` rows by default. If a recomputation later runs for that scope, current rules may rebuild aggregate totals.

Alternative considered: delete point entries during reset. That would make the reset harder to audit and could break prediction history views.

## Risks / Trade-offs

- Rule recomputation can touch many predictions -> run inside bounded transactions per match or per user batch, show clear feedback, and reuse existing scoring helpers where possible.
- Future-only rule edits can make historical point entries differ from current rules -> audit metadata MUST store the impact mode and before/after rules.
- Resetting aggregate scores while point entries remain creates a manual correction state -> label it as an admin reset in audit history and avoid deleting prediction history.
- Global bolao operations affect `User.points` directly -> keep global and custom bolao reset paths separate in service code and tests.

## Migration Plan

No schema migration is required for the initial implementation. Deployment can add server actions, admin routes/components, and tests around existing models.

Rollback is code-only: remove the admin forms/actions while leaving existing league and audit data intact. Audit events created during use remain immutable history.

## Open Questions

- Should recomputation be limited to finished matches only, or also rebuild pending entries for custom leagues that have not published yet?
- Should reset actions support setting a custom score value later, or only zeroing values for now?
