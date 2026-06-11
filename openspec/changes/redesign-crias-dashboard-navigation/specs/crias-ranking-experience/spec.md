## ADDED Requirements

### Requirement: Ranking is a first-class page
The system SHALL render `/leaderboard` as a dedicated ranking page inside the primary authenticated app shell.

#### Scenario: Ranking route shell
- **WHEN** an authenticated user opens `/leaderboard`
- **THEN** the page uses the same shell and navigation model as Dashboard, Palpites, and Tabela

### Requirement: Ranking shows podium and full list
The Ranking page SHALL present top competitors, the current user's position, and a complete ranking list for the active league context.

#### Scenario: Ranking data visible
- **WHEN** ranking members exist
- **THEN** the page displays the top positions, the current user's row or summary, and the full ordered list

### Requirement: Ranking supports league context
The Ranking page SHALL respect the active league selection and allow users to switch context consistently with other player pages.

#### Scenario: League-specific ranking
- **WHEN** a user selects a non-global league context
- **THEN** Ranking displays members and points for that league instead of global ranking data

### Requirement: Ranking is mobile-readable
The Ranking page SHALL avoid desktop-only tables on small screens.

#### Scenario: Mobile ranking layout
- **WHEN** the viewport width is 375px
- **THEN** ranking rows are readable as compact rows or cards without horizontal page overflow
