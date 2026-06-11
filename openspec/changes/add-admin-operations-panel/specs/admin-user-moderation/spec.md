## ADDED Requirements

### Requirement: Search and inspect users
The system SHALL allow authorized moderators to search users and inspect safe operational profile data, league participation, activity counts, and moderation state.

#### Scenario: Moderator searches by email
- **WHEN** an authorized moderator searches for a user by email text
- **THEN** the system returns matching users with safe administrative summary fields

### Requirement: Apply user sanctions
The system SHALL allow authorized moderators to block, suspend, ban, or reactivate user accounts with a recorded reason.

#### Scenario: Moderator bans user
- **WHEN** an authorized moderator bans a user with a reason
- **THEN** the user's account status is updated, active sessions are revoked, and an audit event is recorded

#### Scenario: Moderator reactivates user
- **WHEN** an authorized moderator reactivates a blocked, suspended, or banned user with a reason
- **THEN** the user's account status is restored to active and an audit event is recorded

### Requirement: Enforce sanctions in auth-sensitive flows
The system SHALL prevent banned or currently suspended users from logging in or performing protected mutations.

#### Scenario: Banned user attempts login
- **WHEN** a banned user submits valid credentials
- **THEN** the system rejects login without creating a new session

### Requirement: Delete ordinary users in batch
The system SHALL allow authorized moderators to permanently delete multiple eligible ordinary users with one required reason and one audit event.

#### Scenario: Moderator deletes an eligible batch
- **WHEN** a moderator selects ordinary users without owned leagues and submits one valid reason
- **THEN** the users and dependent records are deleted and the audit log records the reason and affected accounts

#### Scenario: Protected account is included
- **WHEN** the batch includes the current moderator, a platform admin, the system account, or a user who owns a league
- **THEN** the system rejects the complete batch without deleting any selected user
