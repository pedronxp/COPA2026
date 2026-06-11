## 1. Navigation And Branding Foundation

- [x] 1.1 Read the local Next.js 16 app-router docs relevant to pages, layouts, metadata, server components, and client components before changing code.
- [x] 1.2 Create a shared authenticated navigation model with Dashboard, Palpites, Resultados, Tabela, Ranking, Boloes, and Historico route metadata.
- [x] 1.3 Update `PlayerAppShell` to consume the shared navigation model for desktop and mobile navigation.
- [x] 1.4 Apply Copa dos Crias branding consistently across app shell, landing, auth screens, metadata, and share text.
- [x] 1.5 Implement desktop sidebar auto-collapse with hover and focus-within expansion, compact brand mark, active states, and keyboard-accessible labels.
- [x] 1.6 Design and implement the mobile navigation pattern for primary destinations plus secondary route access.

## 2. Ranking Route Migration

- [x] 2.1 Add server-side leaderboard data loading that respects active league context and current user identity.
- [x] 2.2 Replace `/leaderboard` legacy `BolaoApp` usage with the primary app shell.
- [x] 2.3 Implement a dedicated Ranking view with podium/top competitors, current user summary, full ranking list, and empty states.
- [x] 2.4 Ensure league switching updates Ranking data consistently with Dashboard, Palpites, and Tabela.
- [x] 2.5 Add responsive ranking layout for 320px, 375px, tablet, and desktop widths.

## 3. Dashboard Redesign

- [x] 3.1 Rework dashboard information architecture into hero/action area, stat summaries, prediction progress, ranking preview, upcoming predictions, recent results, and scoring rules.
- [x] 3.2 Add clear primary actions to Palpites, Ranking, and Tabela while preserving active league context.
- [x] 3.3 Add subtle motion for progress and status states with reduced-motion safeguards.
- [x] 3.4 Improve dashboard empty states for no matches, no predictions, no recent results, and no ranking members.
- [x] 3.5 Verify dashboard mobile stacking and desktop hierarchy across target breakpoints.

## 4. Palpites And Tabela Responsiveness

- [x] 4.1 Improve Palpites cards for touch input, long team names, score editing, save/update feedback, and disabled states.
- [x] 4.2 Ensure Palpites clearly labels open, saved, upcoming, locked, live, and finished matches.
- [x] 4.3 Improve Tabela group selector for small screens without layout breakage.
- [x] 4.4 Improve standings and group match display for mobile readability.
- [x] 4.5 Improve knockout match display so it remains readable on mobile and desktop.

## 5. Security Hardening

- [x] 5.1 Define and implement an authorization helper for operational/admin-only API actions.
- [x] 5.2 Restrict password reset request listing, approval, and rejection to authorized operational users.
- [x] 5.3 Update forgot-password behavior so public responses do not disclose whether an email exists.
- [x] 5.4 Add or strengthen request body validation for sensitive mutating API routes.
- [x] 5.5 Add abuse-prevention controls for login, registration, and password reset flows.
- [x] 5.6 Preserve secure session cookie options and add regression coverage where practical.

## 6. Testing And QA

- [x] 6.1 Add or update unit tests for navigation data, ranking data behavior, and security authorization.
- [x] 6.2 Run `npm run lint`.
- [x] 6.3 Run `npm test`.
- [x] 6.4 Run `npm run build`.
- [ ] 6.5 Perform responsive visual QA at 320px, 375px, 430px, 768px, 1024px, 1366px, and wide desktop.
- [x] 6.6 Review the final diff for unrelated user changes and avoid reverting work outside this change.
