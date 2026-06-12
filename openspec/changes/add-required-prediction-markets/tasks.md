## 1. Domain And Data Model

- [x] 1.1 Define shared TypeScript constants and types for result picks, total-goals picks, and both-teams-to-score picks.
- [x] 1.2 Add pure validation helpers for required market values and supported total-goals options.
- [x] 1.3 Add a Prisma migration for explicit prediction market fields: result pick, total-goals pick, and both-teams-to-score pick.
- [x] 1.4 Decide and implement the league scoring configuration path for replacing user-facing saldo with total-goals points.
- [x] 1.5 Add a compatibility strategy for existing predictions that do not have the new required market fields.

## 2. Prediction API

- [x] 2.1 Update `/api/predictions` POST parsing to accept exact score, result pick, total-goals pick, and both-teams-to-score pick.
- [x] 2.2 Reject prediction saves with missing required markets or unsupported market values.
- [x] 2.3 Preserve existing match edit-window, league membership, and edit-limit enforcement while validating the new fields.
- [x] 2.4 Update prediction response payloads and player route data so saved market values render after refresh.
- [x] 2.5 Add API regression tests for complete saves, incomplete saves, invalid total-goals values, and contradictory but valid picks.

## 3. Independent Scoring

- [x] 3.1 Update scoring-domain logic to score exact score, result, total goals, and both-teams-to-score independently.
- [x] 3.2 Implement total-goals scoring for Over 1.5, 2.5, 3.5, 4.5, and open-ended Over 5.5+.
- [x] 3.3 Implement Under 1.5, 2.5, 3.5, 4.5, and 5.5 scoring.
- [x] 3.4 Update scoring event or breakdown output so each market contribution can be audited or displayed.
- [x] 3.5 Add focused scoring tests for contradictory picks, Over 5.5+ with 6+ goals, Under thresholds, result picks, and both-teams-to-score picks.

## 4. Player Prediction UI

- [x] 4.1 Replace user-facing saldo labels and explanations with total-goals labels and explanations on Palpites.
- [x] 4.2 Add required result, total-goals, and both-teams-to-score selectors to each editable match card.
- [x] 4.3 Keep exact-score inputs prominent and touch-friendly while ensuring selector values remain independent from the score inputs.
- [x] 4.4 Block the save action and show clear feedback when any required market is missing.
- [x] 4.5 Update saved prediction summaries to show exact score, result pick, total-goals pick, and both-teams-to-score pick.

## 5. Mobile Responsive Layout

- [x] 5.1 Redesign the mobile match card so badge/logo, country name, score inputs, selectors, and save action fit without horizontal overflow.
- [x] 5.2 Use compact dropdown/select-style controls for result, total goals, and both-teams-to-score on mobile.
- [x] 5.3 Add long-team-name handling with constrained widths, responsive font sizing, and truncation before disruptive wrapping.
- [x] 5.4 Preserve accessible full team names when visible names are shortened.
- [x] 5.5 Verify card layout at 320px, 375px, 430px, 768px, and desktop widths.

## 6. League And Summary Surfaces

- [x] 6.1 Update league creation and league detail rule summaries to show total-goals scoring instead of saldo.
- [x] 6.2 Update dashboard and player rules summaries to include the new required markets.
- [x] 6.3 Update history/results displays so completed predictions show independent market outcomes clearly.
- [x] 6.4 Update admin league views to display the new market scoring configuration consistently.

## 7. Verification

- [x] 7.1 Run Prisma generation and any required migration validation.
- [x] 7.2 Run unit tests for domain validation, scoring, and view-model helpers.
- [x] 7.3 Run API and integration tests that cover prediction saves and scoring recalculation.
- [x] 7.4 Run `npm run lint`.
- [x] 7.5 Run `npm run build`.
- [x] 7.6 Perform responsive visual QA of the Palpites card on mobile and desktop.
