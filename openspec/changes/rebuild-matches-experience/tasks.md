## 1. Preparation

- [x] 1.1 Read the relevant Next.js guide under `node_modules/next/dist/docs/` before editing `/matches` or related app-router files.
- [x] 1.2 Review `src/app/matches/page.tsx`, `src/components/player/matches-board.tsx`, `src/lib/player-routes-data.ts`, `/api/predictions`, and current player shell styles to confirm integration points.
- [x] 1.3 Identify which existing CSS selectors can be reused and which rebuilt matches selectors need scoped additions.

## 2. Match State Model

- [x] 2.1 Add pure helper logic for deriving each match view state from matches, predictions, active league rules, stats, and current time.
- [x] 2.2 Derive counts for open, unsaved, saved, upcoming, locked, live, and finished matches.
- [x] 2.3 Derive filter options for action states, groups, stages, and dates from the loaded match data.
- [x] 2.4 Derive grouped visible match sections in kickoff order for the active filter.
- [x] 2.5 Add focused tests for helper logic where practical, especially window state, edit availability, counts, and filtering.

## 3. Rebuilt Matches UI

- [x] 3.1 Replace the flat `MatchesBoard` layout with a summary-first page structure that keeps the active league and rules visible.
- [x] 3.2 Implement actionable filter controls for all matches, open, unsaved, saved, groups, stages, and date-oriented views.
- [x] 3.3 Implement grouped match sections with stable date or stage headings and empty states for filters with no matches.
- [x] 3.4 Redesign match rows/cards to display teams, kickoff, stage or group, prediction window status, saved score state, edit count, stats, and the primary save/update action.
- [x] 3.5 Ensure missing stats, TBD teams, finished matches, live matches, and locked matches render without broken layout or misleading actions.

## 4. Prediction Interaction

- [x] 4.1 Preserve score input validation for integer values from 0 to 99 and block incomplete saves before calling the API.
- [x] 4.2 Enable editing only for scheduled matches inside the active league window and below the active league edit limit.
- [x] 4.3 Keep `/api/predictions` POST compatibility with `matchId`, `homeGuess`, `awayGuess`, and `leagueId`.
- [x] 4.4 Show per-match saving state and page-level success or error feedback.
- [x] 4.5 Refresh server-backed data after a successful save while keeping rejected input visible for correction.

## 5. Responsive Styling

- [x] 5.1 Add scoped styles for the rebuilt matches surface in `src/app/globals.css` or an existing local styling pattern.
- [x] 5.2 Verify desktop layout has no overlapping text, unstable controls, or nested-card clutter.
- [x] 5.3 Verify mobile layout stacks summary, filters, match details, score inputs, and actions without horizontal overflow.
- [x] 5.4 Check color usage against the existing player shell palette while avoiding a one-note page treatment.

## 6. Verification

- [x] 6.1 Run type checking and linting for the project.
- [x] 6.2 Run existing unit tests and any new helper tests.
- [x] 6.3 Start the local app and inspect `/matches` in a browser on desktop and mobile viewports.
- [x] 6.4 Manually verify open, upcoming, locked, saved, unsaved, live, finished, empty, success, and error states where seed data allows.
