## ADDED Requirements

### Requirement: Protect admin routes with platform roles
The system SHALL restrict admin pages and admin mutation endpoints to authenticated users with an allowed platform admin role.

#### Scenario: Non-admin opens admin page
- **WHEN** an authenticated user without a platform admin role requests an admin page
- **THEN** the system rejects access with a forbidden response or redirects away from the admin area

#### Scenario: Admin opens admin page
- **WHEN** an authenticated platform admin requests an admin page
- **THEN** the system renders the admin experience appropriate for the admin role

### Requirement: Enforce permissions per role
The system SHALL enforce role-specific permissions for support, moderation, operations, and super-admin actions.

#### Scenario: Support user attempts operator action
- **WHEN** a support admin attempts to correct a match score or trigger synchronization
- **THEN** the system rejects the action without changing operational data

#### Scenario: Super admin performs restricted action
- **WHEN** a super admin performs a privileged admin action
- **THEN** the system allows the action if the request is valid

### Requirement: Preserve operations-secret compatibility
The system SHALL keep machine-oriented operational endpoints compatible with the configured operations secret while adding browser admin authorization for admin UI flows.

#### Scenario: Machine sync call uses secret
- **WHEN** a request includes the valid operations secret for a supported operational endpoint
- **THEN** the system authorizes the machine operation without requiring an admin browser session
