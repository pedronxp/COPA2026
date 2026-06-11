## Why

The current `/matches` experience exposes the basic prediction workflow, but it is difficult to scan, plan, and act across many World Cup fixtures because matches are presented as a flat card grid with limited scheduling context. Rebuilding it now creates a clearer core surface for players before league-specific rules, edit limits, and prediction windows become more central to the product.

## What Changes

- Replace the flat matches board with a redesigned `/matches` experience focused on quick scanning, prediction readiness, and league-aware context.
- Introduce summary states that help players understand how many matches are open, upcoming, saved, locked, live, or finished in the active league.
- Add richer filtering and grouping so players can move between open matches, unsaved matches, saved predictions, groups, knockout rounds, and match dates without losing context.
- Redesign each match interaction to make team identity, kickoff time, prediction window status, saved score, edit count, and save/update action immediately visible.
- Preserve existing prediction validation, league membership checks, edit limits, and closing-window rules enforced by the API.
- Improve empty, loading, saving, success, and error states so the page remains useful when no matches are currently actionable.
- Keep `/matches` as the route entry point inside the authenticated player shell.

## Capabilities

### New Capabilities

- `matches-experience`: Defines the rebuilt player-facing matches and predictions experience for `/matches`.

### Modified Capabilities

- None.

## Impact

- Affected UI: `src/app/matches/page.tsx`, `src/components/player/matches-board.tsx`, related player shell styles in `src/app/globals.css`, and any new components introduced for the rebuilt matches surface.
- Affected data flow: `getMatchesPageData`, `MatchData`, prediction data, match stats, and active league context currently consumed by `/matches`.
- Affected APIs: existing `/api/predictions` behavior should remain compatible; no new API is required unless implementation finds the current payload insufficient for the redesigned view.
- Testing impact: component behavior, prediction-save flows, filter/group logic, and existing match/prediction service tests should be verified or expanded.
