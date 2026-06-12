## MODIFIED Requirements

### Requirement: Show admin overview metrics
The system SHALL show platform admins a dashboard with user, league, match, prediction, password reset, and audit summary metrics in a scannable operational cockpit.

#### Scenario: Admin views dashboard
- **WHEN** an authorized admin opens `/admin`
- **THEN** the system displays current operational counts, pending work indicators, sync health, quick operational paths, and recent audit activity

### Requirement: Link pending work to admin queues
The system SHALL link dashboard queue cards and quick actions to their corresponding admin pages.

#### Scenario: Pending reset requests exist
- **WHEN** pending password reset requests are counted on the dashboard
- **THEN** the dashboard provides prominent navigation to the reset request queue

### Requirement: Support professional admin navigation
The system SHALL provide an admin shell with active navigation state, role identity, section descriptions, and a clear return path to the player app.

#### Scenario: Admin navigates between sections
- **WHEN** an authorized admin opens any `/admin` section
- **THEN** the current section is visually marked and the sidebar keeps all admin sections reachable

### Requirement: Separate destructive admin actions
The system SHALL visually separate destructive actions from routine moderation, editing, filtering, and sync operations.

#### Scenario: Admin reviews user operations
- **WHEN** an admin opens `/admin/users`
- **THEN** batch deletion controls appear separately from normal account moderation controls

### Requirement: Preserve admin authorization and audit contracts
The system SHALL keep all privileged admin mutations behind server-side authorization and existing audit logging.

#### Scenario: Admin submits a mutation form
- **WHEN** a form on an admin page invokes a Server Action
- **THEN** the action performs the existing admin permission check before mutating data
