## Why

The current prediction flow centers on exact score and goal-difference scoring, but the product now needs a richer betting-style match card where players make separate mandatory picks for result, total goals, and both-teams-to-score. This also gives the mobile Palpites experience a clearer structure before the feature is expanded further.

## What Changes

- Replace the user-facing "Saldo" prediction market with a required "Total de gols" market.
- Add required independent prediction markets for:
  - Exact score: home goals and away goals.
  - Result: home wins, draw, or away wins.
  - Total goals: Over/Under thresholds.
  - Both teams to score: yes or no.
- Treat all markets as independent picks; the system SHALL allow contradictory combinations such as an exact score of 2x1 with result "draw" or total goals "Under 1.5".
- Add total-goals options:
  - Over 1.5, Over 2.5, Over 3.5, Over 4.5, and Over 5.5+.
  - Under 1.5, Under 2.5, Under 3.5, Under 4.5, and Under 5.5.
- Define Over 5.5+ as an open-ended highest bucket that wins for any match with 6 or more total goals, with no maximum cap.
- Require every active market value before a prediction can be saved.
- Redesign the mobile match card so team identity, exact score, result, total goals, both-teams-to-score, and the save action remain readable without horizontal overflow.
- Use compact selectors/dropdowns for result, total goals, and both-teams-to-score on mobile instead of showing many action buttons at once.
- Add responsive handling for long team names so the card keeps a complete layout by reducing/truncating text before allowing unpleasant multi-line wrapping.
- **BREAKING**: Existing prediction persistence, API payloads, scoring logic, and historical prediction records need migration or compatibility handling because predictions will require additional market fields.

## Capabilities

### New Capabilities

- `prediction-markets`: Defines required independent match prediction markets, total-goals Over/Under behavior, validation, scoring, and responsive mobile presentation.

### Modified Capabilities

- None.

## Impact

- Affected database schema: prediction records need fields for result pick, total-goals pick, and both-teams-to-score pick.
- Affected API: `/api/predictions` must accept, validate, return, and preserve the new required market values.
- Affected scoring: scoring must evaluate exact score, result, total goals, and both-teams-to-score independently.
- Affected league rules: league configuration must expose point values for result, total goals, both-teams-to-score, and exact score while retiring user-facing goal-difference/saldo behavior.
- Affected UI: `src/components/player/matches-board.tsx`, match view-model helpers, league creation/rules surfaces, dashboard/rules summaries, history/result displays, and responsive CSS in `src/app/globals.css`.
- Affected tests: prediction validation, scoring-domain tests, API route tests, match card/mobile layout coverage, and migration/backward-compatibility tests.
