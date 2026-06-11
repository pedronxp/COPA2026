## Why

The current leagues experience mixes discovery, creation, participation, ranking, rules, and administration inside one large client component, while private-league authorization and league-specific statistics are not consistently enforced. The product also needs public leagues, stable league URLs, configurable scoring, and controlled ranking publication before the 2026 competition begins.

## What Changes

- Add public and private leagues with explicit join policies: open, approval, or invite-only.
- Give every league a unique, human-readable URL based on a stable slug.
- Add public league discovery with leader, ranking preview, rules, status, and participant count.
- Redesign `/leagues`, `/leagues/create`, `/leagues/join`, and `/leagues/[slug]` as focused responsive experiences.
- Add scoring presets and validated custom scoring rules.
- Add configurable home-win, draw, away-win, exact-score, goal-difference, and both-teams-to-score values with an understandable score breakdown.
- Add league-specific visual themes, exact-score hot streaks, and WhatsApp sharing.
- Add configurable prediction windows, edit limits, member limits, and league lifecycle states.
- Add ranking calculation and publication cycles by match, round interval, phase, or custom administrative release.
- Separate calculated, pending, and published league points with an auditable point ledger.
- Enforce league membership and role authorization for predictions, rankings, statistics, settings, and member management.
- Add safe ownership transfer, leaving, invitation rotation, league closing, and archival flows.
- Remove automatic membership creation when submitting a prediction to a private league.
- Correct match statistics so they are scoped to the selected league.

## Capabilities

### New Capabilities

- `league-management`: League creation, lifecycle, URLs, visibility, membership limits, roles, and administration.
- `league-discovery-access`: Public discovery, private access, invitations, approval requests, and visibility-safe league views.
- `league-scoring-rules`: Scoring presets, custom point values, prediction windows, edit limits, validation, and rule locking.
- `league-scoring-rules`: Scoring presets, custom point values, both-teams-to-score bonuses, prediction windows, edit limits, validation, and rule locking.
- `league-ranking-cycles`: Per-match point calculation, pending versus published points, round/phase publication policies, snapshots, and corrections.

### Modified Capabilities

None. This repository has no existing OpenSpec capability specifications.

## Impact

- Prisma models and database migration for leagues, memberships, scoring events, publication cycles, and snapshots.
- League, prediction, match-statistics, and ranking APIs.
- Routing under `src/app/leagues` using Next.js 16 dynamic segments.
- Decomposition of league-related behavior currently embedded in `src/components/bolao-app.tsx`.
- Authorization helpers, validation, transaction boundaries, indexes, tests, and responsive CSS.
- Existing league data will receive generated slugs and compatibility defaults matching current behavior.
