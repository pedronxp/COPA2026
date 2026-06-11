## Why

The authenticated experience is split across two menu systems and two visual languages, which makes important pages such as Ranking feel disconnected or hidden. This change standardizes the product around the Copa dos Crias identity, improves dashboard engagement, and makes the core flows usable on mobile and desktop.

## What Changes

- Rename visible product branding from COPA-ANT/Copa 2026 to Copa dos Crias across the user-facing app shell and related page metadata.
- Replace competing navigation models with one authenticated navigation contract for Dashboard, Palpites, Resultados, Tabela, Ranking, Boloes, and Historico.
- Make the desktop menu auto-collapse by default and expand on hover/focus while preserving keyboard accessibility.
- Redesign the dashboard into an interactive command center with stronger hierarchy, quick actions, next-match context, prediction progress, ranking preview, recent results, and scoring rules.
- Rebuild the Ranking page as a first-class route in the modern app shell instead of relying on the legacy all-in-one app component.
- Improve the Palpites and Tabela pages for touch interaction, small screens, long team names, filters, tables, and clear saved/locked/live states.
- Add responsive QA targets for phone, tablet, desktop, and wide desktop layouts.
- Address security gaps in sensitive API flows, especially password reset request management and mutation endpoints.

## Capabilities

### New Capabilities

- `crias-app-navigation`: Covers the Copa dos Crias app shell, unified menu, auto-collapsing desktop navigation, and mobile navigation behavior.
- `crias-dashboard-experience`: Covers the redesigned authenticated dashboard and its interactive summary modules.
- `crias-ranking-experience`: Covers the standalone Ranking page, leaderboard data presentation, active league context, and mobile ranking layout.
- `crias-responsive-match-table`: Covers responsive improvements for Palpites and Tabela/Calendario views.
- `crias-security-hardening`: Covers authorization, validation, and abuse-prevention requirements for sensitive auth and mutation routes.

### Modified Capabilities

- None. No archived baseline specs exist yet; this change introduces the relevant capability contracts.

## Impact

- Affected UI code includes `src/components/player/app-shell.tsx`, `src/components/player/dashboard-view.tsx`, `src/components/player/matches-board.tsx`, `src/components/player/calendar-view.tsx`, `src/app/leaderboard/page.tsx`, related player components, and `src/app/globals.css`.
- Affected legacy integration includes reducing or removing route reliance on `src/components/bolao-app.tsx` for Ranking, Results, and History where applicable.
- Affected data services include `src/lib/player-routes-data.ts`, ranking/league services, and route handlers that feed leaderboard or league context data.
- Affected security code includes auth APIs, password reset request APIs, session helpers, API authorization helpers, and sensitive league/prediction mutation routes.
- Verification should include lint, unit tests, production build, and responsive visual checks across 320px, 375px, 430px, 768px, 1024px, 1366px, and wide desktop.
