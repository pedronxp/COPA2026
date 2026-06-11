## Context

`/matches` currently renders an authenticated player page through `PlayerAppShell`, loads `getMatchesPageData`, and delegates the full interactive surface to `MatchesBoard`. The board receives matches, active league context, existing predictions, league-specific match stats, and member data, then renders a flat card grid with fixed stage/group filters and per-card save actions.

The rebuild should preserve the existing server data path and prediction API contract while replacing the client experience with a more structured workflow. Players need to know which matches need attention, which are open, which are already saved, and which are locked by time or edit limits before they choose a match.

## Goals / Non-Goals

**Goals:**

- Make `/matches` a league-aware command surface for finding and saving match predictions quickly.
- Derive page summaries from existing `matches`, `predictions`, `stats`, and `activeLeague` data without adding a database migration.
- Group and filter matches by actionable state, date, group, and stage while keeping player progress visible.
- Keep save/update behavior compatible with `/api/predictions` and the current league validation rules.
- Improve responsive behavior so mobile users can scan and edit predictions without cramped card layouts.
- Keep the design consistent with the existing player shell and restrained operational UI style.

**Non-Goals:**

- Changing scoring rules, prediction validation, edit limit enforcement, league membership rules, or prediction window calculations on the server.
- Replacing the active league switcher or authenticated player shell.
- Adding real-time updates, push notifications, or background sync.
- Introducing new third-party UI/state dependencies unless implementation discovers an existing local dependency that already solves the need.
- Reworking unrelated dashboard, calendar, leaderboard, or league management pages.

## Decisions

### Keep the existing server route and API contract

`src/app/matches/page.tsx` should continue to load `getMatchesPageData` after `requireUser('/matches')` and render inside `PlayerAppShell`. The client can reshape derived state locally, but saving predictions should continue to POST `{ matchId, homeGuess, awayGuess, leagueId }` to `/api/predictions`.

Alternative considered: add a dedicated matches view-model endpoint. That would centralize derived state, but it is unnecessary while all required data is already loaded server-side and would increase API surface area before implementation proves a need.

### Build derived match state in the client component

The rebuilt board should compute a normalized view model per match: prediction status, window state, edit availability, saved score, stage/date labels, stats, and action state. This keeps display logic close to the interactive UI and avoids changing persistence models.

Alternative considered: enrich `getMatchesPageData` with view-specific buckets. That would reduce client work, but it would make a server data helper responsible for UI-specific grouping and filter labels.

### Use a summary-first layout

The top of the page should expose league rules plus counts for open, unsaved, saved, locked/live/finished, and upcoming matches. Filters should operate on these same states so a player can jump directly to the next useful task.

Alternative considered: preserve the existing stage-only filter bar and improve card styling. That would be less risky, but it would not address the main scanning and planning problem.

### Prefer grouped lists over equal-weight cards

Matches should be grouped into date or stage sections after filtering, with compact rows/cards that keep kickoff, teams, score editor, state badge, edit count, stats, and action controls stable. Mobile layout should place the score editor and primary action in predictable positions.

Alternative considered: a full table. Tables scan well on desktop, but team marks, score inputs, and action states become awkward on narrow screens.

### Preserve optimistic restraint

The UI should update local input state immediately, show per-match saving state, and refresh the router after a successful save. It should avoid pretending a save succeeded before the API returns because server-side league and time-window rules are authoritative.

Alternative considered: full optimistic save. That would feel faster, but it could mislead users when the server rejects late windows, inactive memberships, or edit limits.

## Risks / Trade-offs

- More derived client state can become hard to follow -> isolate pure helper functions for bucketing, filtering, counting, and window state; cover them with focused tests where practical.
- The page may become visually dense -> use compact summary bands and grouped sections, not nested cards or marketing-style hero treatments.
- Time-window labels can drift while the page is open -> calculate initial labels from current time and keep server validation authoritative; optional timed refresh can be added only if implementation remains simple.
- Existing CSS already contains legacy and player route styles -> scope new selectors to the rebuilt matches surface to avoid regressions on dashboard/calendar.
- Stats are currently loaded only for active matches -> finished or locked rows must tolerate missing stats and show neutral copy instead of broken bars.
- Large match lists can be expensive to render -> keep grouping and filtering memoized and avoid per-row expensive date parsing beyond normalized helpers.
