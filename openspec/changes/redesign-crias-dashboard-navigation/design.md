## Context

The app currently has two authenticated UI systems. The newer player shell powers `/dashboard`, `/matches`, and `/calendar`, while the legacy `BolaoApp` still powers routes such as `/leaderboard`, `/results`, and `/history`. This creates inconsistent menus, makes Ranking disappear from the newer shell, and forces users to move between different visual patterns.

The redesign also needs to incorporate the Copa dos Crias brand, a desktop menu that hides itself by default, a stronger dashboard, a first-class ranking page, responsive match/table flows, and security hardening for sensitive endpoints.

## Goals / Non-Goals

**Goals:**

- Establish Copa dos Crias as the visible product identity across authenticated and entry screens.
- Use one authenticated navigation model for Dashboard, Palpites, Resultados, Tabela, Ranking, Boloes, and Historico.
- Make the desktop sidebar auto-collapse to an icon rail and expand on hover/focus.
- Keep navigation keyboard-accessible and usable on mobile.
- Redesign dashboard, ranking, match prediction, and table/calendar views around responsive layouts.
- Reduce dependency on the legacy all-in-one app component for core authenticated routes.
- Harden sensitive API behavior before treating the redesign as complete.

**Non-Goals:**

- Replacing the scoring rules or league domain model.
- Changing database schema unless security work reveals a required permission field.
- Adding a new visual framework or design dependency.
- Rewriting every legacy screen in one step if a route can be safely migrated incrementally.

## Decisions

### Decision: Use `PlayerAppShell` as the primary authenticated shell

`PlayerAppShell` will become the standard shell for the main authenticated product. It already supports server-provided active league context and aligns with the newer `/dashboard`, `/matches`, and `/calendar` pages.

Alternative considered: keep both `PlayerAppShell` and `BolaoApp` active for separate route groups. This preserves short-term behavior but keeps the navigation inconsistency and makes Ranking harder to expose consistently.

### Decision: Centralize navigation data

Navigation items will be defined once and consumed by desktop and mobile navigation. Route metadata must include href, label, mobile label, icon, active matching rule, and whether league context should be preserved through the `league` query.

Alternative considered: duplicate the arrays in each shell. This is faster locally but caused the current drift.

### Decision: Desktop sidebar collapses with CSS-first behavior

The sidebar will default to an icon rail, expand on `:hover` and `:focus-within`, and reveal labels/user details only while expanded. This avoids client state for the core desktop menu behavior and keeps keyboard users supported.

Alternative considered: use a client-side toggle. A toggle can be added later for persistence, but it is not necessary for the requested auto-hide behavior.

### Decision: Mobile navigation uses priority plus overflow

The mobile bottom nav must not squeeze seven full routes into equal tiny buttons. The primary mobile nav should expose the most common destinations and provide a "Mais" pattern or compact overflow for secondary destinations.

Alternative considered: horizontal scroll for every nav item. This is simple but can hide important routes and is less predictable for a core app menu.

### Decision: Ranking gets a dedicated player route

`/leaderboard` will fetch server-side data through `player-routes-data` or a similar server-only helper and render a dedicated `LeaderboardView` inside `PlayerAppShell`. It must show podium, current user position, full ranking, and league switcher context.

Alternative considered: continue rendering `BolaoApp initialSection="leaderboard"`. This keeps legacy behavior but prevents the redesign from being consistent.

### Decision: Security fixes are part of the redesign acceptance

The password reset request management route and other sensitive mutations must enforce authorization, validation, and safer error behavior. A polished UI without these fixes would leave an avoidable operational risk.

Alternative considered: treat security as a later cleanup. This is risky because the current reset-management behavior can expose privileged actions to ordinary authenticated users.

## Risks / Trade-offs

- Legacy route migration can create duplicated UI during transition -> migrate one route at a time and keep route-level behavior tests or smoke checks.
- Auto-collapsing sidebars can frustrate users if labels disappear too aggressively -> support hover, focus-within, tooltips/title attributes, and a clear active state.
- Mobile overflow menus can hide secondary pages -> keep Ranking, Palpites, Dashboard, and Tabela directly visible; place only secondary routes behind overflow if needed.
- Ranking data can diverge between global and league-specific contexts -> reuse existing active league context and ranking service boundaries.
- CSS changes can cause layout regressions across Bootstrap and custom styles -> keep player-shell styles scoped and verify key breakpoints.
- Security hardening can change error messages or admin workflows -> document new permission rules and add tests before shipping.

## Migration Plan

1. Introduce the shared navigation model and update `PlayerAppShell`.
2. Apply Copa dos Crias branding across visible entry points and metadata.
3. Migrate `/leaderboard` to the modern shell with dedicated data and view components.
4. Redesign `/dashboard` using the new hierarchy and interactive modules.
5. Refine `/matches` and `/calendar` responsive behavior.
6. Harden sensitive auth and mutation routes.
7. Run lint, tests, build, and responsive visual QA.

Rollback strategy: each route migration should be isolated so a route can temporarily fall back to its previous implementation if a blocker appears, while keeping the shared navigation and security fixes intact.

## Open Questions

- Should the mobile "Mais" pattern be a modal sheet, popover menu, or secondary page?
- Should users be able to pin the desktop menu open later, or is pure auto-hide enough for this release?
- Which roles are allowed to manage password reset requests: only a platform admin, league owners, or a specific operational admin role?
