## Context

League behavior is currently spread across a 4,000-line client component, three league route handlers, and the match scoring service. `LeagueMember.points` is the only custom-league total, predictions can implicitly create memberships, match statistics lose the league filter at the route boundary, and the UI has no stable league detail URL.

The expected initial scale is modest: approximately 50 registered users and up to 50 members per league. Correct authorization, auditable scoring, and a coherent user experience matter more than introducing distributed infrastructure.

Next.js 16 pages and dynamic route parameters are asynchronous. Server Components will load league page data and small Client Components will handle forms, tabs, clipboard actions, and destructive confirmations.

## Goals / Non-Goals

**Goals:**

- Support public and private leagues with predictable access control.
- Give leagues stable, unique URLs without using slugs as database identities.
- Make league rules understandable, validated, preset-driven, and safe to lock.
- Calculate points once per prediction and publish rankings according to configurable cycles.
- Preserve an audit trail for scoring corrections and ranking releases.
- Provide focused desktop and mobile flows for discovery, creation, joining, viewing, and administration.
- Remain simple and performant for the expected scale.

**Non-Goals:**

- Generic support for arbitrary sports or user-created tournament brackets.
- Real-time sockets or push notifications.
- Monetary prizes, payments, or regulated wagering.
- A separate microservice or background-job platform.
- Editing historical tournament structure from the UI.

## Decisions

### Use explicit string-backed domain values

Prisma string fields will store visibility, join policy, lifecycle status, publication mode, cycle status, and ledger status. Application-level unions and allowlist validation provide type safety while keeping migration compatibility with the existing database.

Alternative considered: Prisma enums. Enums provide stronger generated types but are less forgiving during staged migrations and rollback. The project currently uses string roles and statuses, so validated strings are the conservative fit.

### Keep UUID identity and add a unique slug

`League.id` remains the relational key. `League.slug` is unique, indexed, generated from the name, and receives a numeric suffix on collision. URLs use `/leagues/[slug]`; APIs may resolve either ID or slug only through explicit helpers.

Alternative considered: replace IDs with slugs. Rejected because renaming would break foreign keys, URLs, and historical records.

### Model access independently from visibility

`visibility` controls whether a league can be discovered and previewed. `joinPolicy` controls entry:

- `open`: authenticated users can join while capacity remains.
- `approval`: authenticated users create a pending request.
- `invite`: a valid active invite code is required.

Private league details, rankings, members, predictions, and statistics require membership. Public visitors receive only the public projection.

### Use validated presets plus copied rule values

The selected preset name is informational. Concrete point values and prediction limits are copied into the league so later preset changes cannot mutate an active league. Custom rules use the same validated fields.

Rules become locked when the first prediction is created. Administrative edits after locking may only affect explicitly future-safe metadata; scoring values and prediction timing remain immutable.

### Separate calculation from publication

Each processed prediction creates one `LeaguePointEntry`, uniquely keyed by prediction. The entry records calculated points, tournament stage, matchday, status, timestamps, and correction metadata.

Custom-league member totals are split into:

- `points`: published points shown in rankings.
- `pendingPoints`: calculated points waiting for publication.

Processing a match increments pending points. Publishing a cycle atomically moves eligible ledger entries to published status, increments `points`, decrements `pendingPoints`, and stores a ranking snapshot.

Alternative considered: recalculate totals from all predictions on every request. This is simple at current scale but makes publication delays, corrections, and audit history difficult to reason about.

### Represent publication behavior with a compact policy

The league stores:

- `scoringStartMatchday`
- `groupPublicationMode`: `match`, `round`, `every_2_rounds`, `every_3_rounds`, `phase`, or `manual`
- `knockoutPublicationMode`: `match`, `stage`, or `manual`

The tournament remains authoritative for stages and matchdays. The service derives cycle keys such as `group:1-2`, `group:3`, or `qf`. No duplicate tournament schedule is stored per league.

### Publish automatically in the existing scoring path

After a match is scored, the service checks whether its cycle is complete using persisted matches. If complete and the policy is automatic, it publishes the cycle in a transaction. A manual endpoint remains available to owners for manual policies and exceptional delayed matches.

Alternative considered: cron/background workers. Rejected for the initial scale; idempotent scoring plus sync-triggered checks is sufficient.

### Use role and projection helpers

Shared server helpers will resolve league access and return one of: public visitor, member, subadmin, or owner. Route handlers will use explicit action checks rather than duplicating role conditions. Public API responses use dedicated projections that exclude invite codes and member emails.

### Decompose the league UI without rewriting the rest of the app

New league routes and components own league discovery and detail experiences. `BolaoApp` continues to serve the existing home, matches, results, ranking, calendar, and history sections during migration. Its league tab becomes a compatibility entry point to `/leagues`.

This avoids a high-risk full application rewrite while removing league complexity from the monolith.

## Risks / Trade-offs

- [Existing databases lack slugs and new required values] -> Add nullable/defaulted fields first, backfill deterministic slugs, then rely on application validation.
- [A sync retry could score twice] -> Use a unique ledger entry per prediction and transactional upserts.
- [A delayed match can block a round] -> Owners can manually publish completed matches in a manual cycle; automatic completion uses finished scheduled matches known to the database.
- [Changing rules after predictions creates unfairness] -> Lock competitive rules at the first prediction.
- [Public rankings can expose personal data] -> Public projections include display name, avatar, rank, and points only.
- [Concurrent joins can exceed capacity] -> Count and create membership within a serializable transaction and retain the unique membership constraint.
- [Large change collides with existing uncommitted work] -> Add focused modules and preserve current files unless integration requires a narrow edit.
- [String domain values can drift] -> Centralize constants, TypeScript unions, and allowlist validators.

## Migration Plan

1. Add backward-compatible fields and new scoring/publication models.
2. Generate and apply the Prisma migration.
3. Backfill slugs, visibility, join policies, statuses, and member limits.
4. Treat existing custom leagues as private and invite-only; keep the global league public.
5. Introduce domain services and access helpers while retaining existing endpoints.
6. Add focused APIs and new league routes.
7. Redirect or simplify the legacy league tab.
8. Reprocess no historical scores automatically; existing member points remain published baseline totals.
9. Validate production data before making new fields operationally required.

Rollback keeps the additive columns and tables but routes traffic back to legacy handlers. No destructive column removal is required for the first release.

## Open Questions

- Whether public leagues allow unauthenticated full ranking views or only a top-five preview. Initial implementation uses a top-five public preview and full ranking for authenticated users.
- Whether owners may publish an incomplete automatic cycle manually. Initial implementation allows this only for `manual` policies.
- Whether approval notifications need email delivery. Initial implementation exposes pending requests in the owner dashboard only.
