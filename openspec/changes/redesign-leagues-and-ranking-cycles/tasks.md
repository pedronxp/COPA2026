## 1. Foundation and Data Model

- [x] 1.1 Add centralized league domain constants, types, validation, slug generation, and scoring presets
- [x] 1.2 Extend the Prisma schema for league visibility, join policies, lifecycle, capacity, slugs, pending points, join requests, point entries, cycles, and snapshots
- [x] 1.3 Add query indexes for memberships, rankings, predictions, matches, and synchronization
- [x] 1.4 Add a backward-compatible data migration and document existing-league defaults

## 2. Security and Domain Services

- [x] 2.1 Implement shared league resolution, public projection, membership, and role authorization helpers
- [x] 2.2 Enforce membership before custom-league predictions and lock competitive rules after the first prediction
- [x] 2.3 Make league creation, joining, capacity checks, role changes, and ownership transfer transactional
- [x] 2.4 Correct league-scoped match statistics and protect private statistics
- [x] 2.5 Remove client-triggered external synchronization and restrict synchronization to an authorized operational path

## 3. Scoring and Ranking Cycles

- [x] 3.1 Make prediction processing idempotent with one ledger entry per prediction
- [x] 3.2 Track pending and published member points separately
- [x] 3.3 Implement group-stage cycle derivation for match, round, interval, phase, and manual policies
- [x] 3.4 Implement knockout cycle derivation for match, stage, and manual policies
- [x] 3.5 Publish eligible cycles transactionally and store ranking snapshots
- [x] 3.6 Implement auditable score adjustments without duplicate totals

## 4. League APIs

- [x] 4.1 Add APIs for my leagues and public league discovery without N+1 queries
- [x] 4.2 Add create, detail, update, close, archive, and invitation-rotation APIs
- [x] 4.3 Add open join, invite join, approval request, approval decision, leave, and ownership-transfer APIs
- [x] 4.4 Add safe public and member ranking APIs with publication metadata
- [x] 4.5 Preserve compatibility for existing league selectors and current application sections

## 5. League Experience

- [x] 5.1 Build the responsive `/leagues` overview with my leagues, public discovery, search, filters, and empty/loading/error states
- [x] 5.2 Build the staged `/leagues/create` flow with identity, access, scoring, publication, and review steps
- [x] 5.3 Build the focused `/leagues/join` invite flow
- [x] 5.4 Build `/leagues/[slug]` with overview, ranking, rules, members, and publication status
- [x] 5.5 Build owner/subadmin settings and member-management surfaces with confirmations
- [x] 5.6 Reduce the legacy `BolaoApp` league tab to a compatibility entry point and keep league selection working elsewhere
- [x] 5.7 Add responsive league styles consistent with the existing Bootstrap design system

## 6. Performance and Reliability

- [x] 6.1 Batch league leaders, ranks, and match statistics to remove N+1 request patterns
- [x] 6.2 Add atomic prediction edit-limit enforcement
- [x] 6.3 Disable production Prisma query logging and remove redundant authenticated-user existence checks
- [x] 6.4 Verify capacity and scoring behavior under concurrent requests

## 7. Verification

- [x] 7.1 Add a test harness and unit tests for validation, slugging, scoring presets, and cycle derivation
- [x] 7.2 Add integration tests for permissions, private data, joins, capacity, prediction membership, idempotent scoring, and publication
- [x] 7.3 Run Prisma validation and generation, lint, tests, and production build
- [x] 7.4 Verify `/leagues`, create, join, public detail, private detail, and mobile layouts in the browser
- [x] 7.5 Update OpenSpec task status and validate the completed change
