## ADDED Requirements

### Requirement: Create a league with a stable identity
The system SHALL allow an authenticated user to create a league with a name, unique slug, visibility, join policy, lifecycle status, member limit, and validated competitive rules.

#### Scenario: Create a public league
- **WHEN** an authenticated user submits valid public-league settings
- **THEN** the system creates the league, assigns the creator as owner, and exposes it at `/leagues/[slug]`

#### Scenario: Resolve a duplicate slug
- **WHEN** the requested slug already belongs to another league
- **THEN** the system generates a deterministic available suffix without changing the league ID

### Requirement: Enforce league capacity
The system SHALL enforce a configurable member limit between 2 and 50 participants.

#### Scenario: Join at capacity
- **WHEN** a user attempts to join a league whose member count equals its limit
- **THEN** the system rejects the membership without exceeding the limit

### Requirement: Manage league lifecycle
The owner SHALL be able to close or archive a league, and archived leagues SHALL reject new memberships and predictions.

#### Scenario: Archive a league
- **WHEN** the owner archives an active league
- **THEN** the league remains available for historical viewing but rejects new joins and predictions

### Requirement: Manage membership roles safely
The system SHALL support owner, subadmin, and member roles with explicit permissions for promotion, demotion, removal, leaving, and ownership transfer.

#### Scenario: Transfer ownership
- **WHEN** the owner transfers ownership to an existing member
- **THEN** the target becomes owner and the previous owner becomes subadmin in one transaction

#### Scenario: Member leaves
- **WHEN** a non-owner member leaves a league
- **THEN** the membership is removed without affecting historical scoring records
