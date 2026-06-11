## ADDED Requirements

### Requirement: Palpites are touch-friendly
The Palpites page SHALL provide touch-friendly score inputs, clear save/update actions, and readable match context on mobile.

#### Scenario: Mobile prediction card
- **WHEN** a user opens Palpites on a 375px viewport
- **THEN** team names, score inputs, match time, and save action are readable and do not overlap

### Requirement: Palpites show match states clearly
The Palpites page SHALL distinguish open, saved, upcoming, locked, live, and finished matches.

#### Scenario: Locked match state
- **WHEN** a match is not editable
- **THEN** the page communicates why the prediction action is unavailable

#### Scenario: Saved match state
- **WHEN** a user's prediction matches the persisted prediction
- **THEN** the save action indicates the prediction is already saved

### Requirement: Tabela supports group browsing
The Tabela page SHALL allow users to browse groups and see classification plus matches for the selected group.

#### Scenario: Group selection
- **WHEN** a user selects a group
- **THEN** the classification and group matches update to that selected group

### Requirement: Tabela adapts to small screens
The Tabela page SHALL present standings, group matches, and knockout matches in a readable mobile layout.

#### Scenario: Mobile standings
- **WHEN** the viewport width is 320px
- **THEN** standings are readable without text overlap or required page zoom

#### Scenario: Mobile group selector
- **WHEN** all groups are available on a small screen
- **THEN** the group selector remains navigable without breaking the page layout
