## ADDED Requirements

### Requirement: Search and inspect leagues globally
The system SHALL allow authorized admins to search leagues and inspect owner, membership, status, visibility, rules, and pending work summary data.

#### Scenario: Admin searches league by name
- **WHEN** an authorized admin searches for a league by name
- **THEN** the system returns matching leagues with safe operational summary fields

### Requirement: Edit league identity and lifecycle
The system SHALL allow authorized admins to rename leagues and change lifecycle status without bypassing validation.

#### Scenario: Admin renames league
- **WHEN** an authorized admin submits a valid new league name with a reason
- **THEN** the league name is updated and an audit event is recorded

#### Scenario: Admin archives league
- **WHEN** an authorized admin changes a league status to archived with a reason
- **THEN** the league status is updated and an audit event is recorded

### Requirement: Show league rule state
The system SHALL show current league scoring and prediction rule fields to admins.

#### Scenario: Admin opens league operations page
- **WHEN** an authorized admin inspects a league
- **THEN** the system displays scoring preset, scoring values, prediction window, edit limit, and rule lock state
