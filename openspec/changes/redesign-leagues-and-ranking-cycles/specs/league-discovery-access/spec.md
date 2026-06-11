## ADDED Requirements

### Requirement: Discover public leagues
The system SHALL provide a searchable public-league listing containing safe summary data, participant count, leader, ranking preview, status, and scoring summary.

#### Scenario: Browse public leagues
- **WHEN** a visitor opens the public league discovery view
- **THEN** the system lists active public leagues without exposing invite codes, emails, or private predictions

### Requirement: Protect private league data
The system SHALL require active membership to view a private league ranking, members, predictions, statistics, and settings.

#### Scenario: Open private URL without membership
- **WHEN** a non-member opens a private league URL
- **THEN** the system shows only an access or invitation prompt and does not return protected league data

### Requirement: Apply join policies
The system SHALL support open joining, approval requests, and invite-only joining independently from league visibility.

#### Scenario: Join an open league
- **WHEN** an authenticated non-member joins an open league with capacity
- **THEN** the system creates a member membership immediately

#### Scenario: Request approval
- **WHEN** an authenticated non-member requests access to an approval league
- **THEN** the system creates one pending request and does not create membership until approved

#### Scenario: Use an invalid invite
- **WHEN** a user submits an invalid or revoked invite code
- **THEN** the system rejects the request without revealing private league details

### Requirement: Rotate league invitations
The owner or subadmin SHALL be able to regenerate the invite code and invalidate the previous code.

#### Scenario: Regenerate invite
- **WHEN** an authorized administrator regenerates an invite
- **THEN** the previous code stops granting access immediately
