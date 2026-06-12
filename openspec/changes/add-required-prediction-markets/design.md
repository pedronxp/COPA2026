## Context

The current Palpites flow uses score inputs as the primary prediction and derives scoring tiers such as exact score, goal difference, match result, and both-teams-to-score. The new product direction turns the prediction card into a set of independent required markets: exact score, result, total goals, and both-teams-to-score.

This is a cross-cutting change. It affects prediction persistence, `/api/predictions`, scoring, league rule display, match-card interaction, mobile responsive behavior, and historical views that show saved predictions or points. The implementation must preserve the existing authenticated player shell and `/matches` data flow while expanding the prediction model.

## Goals / Non-Goals

**Goals:**

- Store explicit independent picks for result, total goals, and both-teams-to-score alongside exact score.
- Require every active market before saving a prediction.
- Score each market independently, even when the user's picks contradict each other.
- Replace user-facing goal-difference/saldo behavior with a total-goals Over/Under market.
- Define Over 5.5+ as the highest open-ended total-goals pick, winning for 6 or more goals with no maximum cap.
- Keep the mobile match card readable by using compact selectors/dropdowns for non-score markets.
- Keep team identity visible on mobile with badge/logo plus country name, including long-name handling that preserves the overall card layout.

**Non-Goals:**

- Adding live betting, odds, cash wagering, or external sportsbook integrations.
- Changing authentication, league membership, prediction windows, or edit-limit enforcement.
- Blocking contradictory picks between exact score, result, total goals, and both-teams-to-score.
- Rebuilding unrelated dashboard, calendar, leaderboard, or admin experiences beyond the rule summaries they display.
- Introducing a new UI framework or third-party form dependency.

## Decisions

### Persist explicit market picks on predictions

Prediction records should gain explicit fields for:

- `resultPick`: home, draw, or away.
- `totalGoalsPick`: one of the supported Over/Under thresholds.
- `bothTeamsScorePick`: yes or no.

The existing `homeGuess` and `awayGuess` fields remain the exact-score market.

Alternative considered: derive result, total goals, and both-teams-to-score from the score inputs. Rejected because the product requires independent picks and explicitly allows contradictory combinations.

### Treat all active markets as required

The client and API should both require exact score, result pick, total-goals pick, and both-teams-to-score pick whenever those markets are enabled for the league. Save requests with missing market values should be rejected before persistence.

Alternative considered: make total goals and both-teams-to-score optional to reduce friction. Rejected because the game design calls for a complete prediction slip for every match.

### Replace saldo with total-goals scoring

User-facing goal-difference/saldo should be retired from the Palpites experience and league rule summaries in favor of total-goals scoring. Internally, the old `pointsDiff` field may be migrated, renamed, or temporarily mapped to a new total-goals point value, but UI copy should say "Total de gols" instead of "Saldo".

Alternative considered: keep both saldo and total goals. Rejected for the initial version because it would add too many simultaneous markets to the mobile card and make scoring harder to understand.

### Use a fixed total-goals market catalog

The total-goals selector should offer:

- Over 1.5: 2 or more goals.
- Over 2.5: 3 or more goals.
- Over 3.5: 4 or more goals.
- Over 4.5: 5 or more goals.
- Over 5.5+: 6 or more goals, with no upper limit.
- Under 1.5: 0 or 1 goal.
- Under 2.5: 0 to 2 goals.
- Under 3.5: 0 to 3 goals.
- Under 4.5: 0 to 4 goals.
- Under 5.5: 0 to 5 goals.

Alternative considered: support arbitrary thresholds per league. Rejected for now because a fixed catalog is simpler to explain, test, and fit into mobile selectors.

### Score each market independently

Scoring should produce independent contributions:

- Exact score points when both score values match the final score.
- Result points when the selected result matches the final result.
- Total-goals points when the selected Over/Under bucket matches the final total goals.
- Both-teams-to-score points when the selected yes/no value matches the final result.

Alternative considered: award result/total/both-teams-to-score only when consistent with the exact score. Rejected because the product decision is that each pick is a separate market.

### Use compact mobile selectors

On mobile, result, total goals, and both-teams-to-score should render as select/dropdown-style controls instead of expanded button grids. Exact score remains prominent with touch-friendly numeric inputs.

Recommended mobile hierarchy:

```text
Time casa [score] x [score] Time fora
Resultado [select]
Total de gols [select]
Ambas marcam [select]
Salvar
```

Alternative considered: show all result, Over/Under, and both-teams-to-score options as buttons. Rejected because it creates too many controls inside each match card on narrow screens.

### Preserve a complete team row with long-name handling

The mobile card should first try to keep team badge/logo and country name in a compact row around the score editor. Long names should use constrained widths, responsive font sizing, and truncation before the layout falls back to multiple lines. The card must avoid horizontal overflow at 320px, 375px, and 430px widths.

Alternative considered: always stack teams vertically. Rejected because it weakens match readability and creates tall cards when many matches are visible.

## Risks / Trade-offs

- Existing predictions lack the new required fields -> Add a migration/backfill strategy and ensure old records can still render in history/results.
- API clients may still send the old payload -> Return clear validation errors and update all first-party callers in the same change.
- Scoring corrections may need to recompute independent market points -> Centralize scoring in domain helpers and cover with focused tests.
- Replacing `pointsDiff` could conflict with existing league configuration -> Decide whether to add a new field or map the old field during migration, and keep admin/league UI copy consistent.
- Mobile selectors can hide too much context -> Use concise labels on the collapsed control, such as "Over 5.5+ (6+ gols)".
- Long team names can still become cramped in some languages -> Apply maximum widths and truncation with accessible full names available via labels/title text.

## Migration Plan

1. Add prediction fields for result, total goals, and both-teams-to-score with a safe migration path for existing data.
2. Add or map league scoring configuration for total-goals points while retiring user-facing saldo labels.
3. Update domain constants and validation for supported market values.
4. Update `/api/predictions` GET/POST behavior to include and validate the new fields.
5. Update scoring logic and point breakdown generation.
6. Update match card UI, saved prediction summaries, result/history displays, and rule summaries.
7. Run data and regression tests before release.

Rollback should preserve the new columns even if the UI is reverted, because dropping prediction data would be riskier than leaving unused fields.

## Open Questions

- Should old predictions be backfilled from their exact-score values, or shown as incomplete legacy predictions for markets that did not exist yet?
- Should total-goals scoring use a single point value for any correct Over/Under pick, or should each threshold eventually have separate point values?
- Should admin and league-creation UI fully remove saldo immediately, or keep an internal compatibility label during migration?
