## ADDED Requirements

### Requirement: Show admin overview metrics
The system SHALL show platform admins a dashboard with user, league, match, prediction, password reset, and audit summary metrics.

#### Scenario: Admin views dashboard
- **WHEN** an authorized admin opens `/admin`
- **THEN** the system displays current operational counts and pending work indicators

### Requirement: Show API synchronization health
The system SHALL show latest sync status, source, latest sync timestamp, created/updated match counts, schedule state, and whether sync is healthy, degraded, failed, or stale.

#### Scenario: Sync has recent log
- **WHEN** a sync log exists
- **THEN** the dashboard displays the latest sync source, time, and update counts

#### Scenario: Sync has no log
- **WHEN** no sync log exists
- **THEN** the dashboard displays an empty health state that tells admins no sync has run

#### Scenario: Backup supplied the latest data
- **WHEN** the latest synchronization used the local backup after a primary API error
- **THEN** the dashboard displays a degraded state and the recorded error instead of reporting the API as healthy

### Requirement: Link pending work to admin queues
The system SHALL link dashboard queue cards to their corresponding admin pages.

#### Scenario: Pending reset requests exist
- **WHEN** pending password reset requests are counted on the dashboard
- **THEN** the dashboard provides navigation to the reset request queue
