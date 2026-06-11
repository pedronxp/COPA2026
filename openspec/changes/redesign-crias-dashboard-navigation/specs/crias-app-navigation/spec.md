## ADDED Requirements

### Requirement: Copa dos Crias brand is displayed consistently
The system SHALL display Copa dos Crias as the visible product brand in primary navigation, entry screens, and page metadata.

#### Scenario: Authenticated shell brand
- **WHEN** an authenticated user opens a route using the primary app shell
- **THEN** the shell displays Copa dos Crias when expanded and a compact brand mark when collapsed

#### Scenario: Entry screen brand
- **WHEN** a visitor opens the landing, login, or registration screen
- **THEN** the visible product name is Copa dos Crias

### Requirement: Authenticated navigation uses one route model
The system SHALL define one authenticated navigation model for Dashboard, Palpites, Resultados, Tabela, Ranking, Boloes, and Historico.

#### Scenario: Ranking appears in navigation
- **WHEN** an authenticated user views the desktop or mobile navigation
- **THEN** Ranking is available as a navigation destination

#### Scenario: Active route is highlighted
- **WHEN** an authenticated user is on any primary route
- **THEN** the matching navigation item is visually marked active

### Requirement: Desktop sidebar auto-collapses
The system SHALL collapse the desktop sidebar to an icon rail by default and expand it on hover or keyboard focus.

#### Scenario: Default desktop state
- **WHEN** a desktop user loads an authenticated page
- **THEN** the sidebar displays compact icons without requiring manual input

#### Scenario: Expanded desktop state
- **WHEN** a desktop user hovers over the sidebar or focuses an item inside it
- **THEN** the sidebar expands and reveals route labels and user details

### Requirement: Mobile navigation remains usable
The system SHALL provide mobile navigation that remains readable and tappable on narrow screens.

#### Scenario: Small phone navigation
- **WHEN** the viewport width is 320px
- **THEN** navigation items do not overlap, truncate incoherently, or require page zoom

#### Scenario: Secondary destinations remain reachable
- **WHEN** a route is not shown as a primary mobile tab
- **THEN** the user can still reach it through a clear overflow or secondary navigation path
