## ADDED Requirements

### Requirement: Inspect sync and match operations
The system SHALL allow authorized operators to inspect recent sync logs and match operational status.

#### Scenario: Operator opens API operations page
- **WHEN** an authorized operator opens the match/API operations page
- **THEN** the system displays recent sync logs and match status summaries

### Requirement: Trigger manual synchronization
The system SHALL allow authorized operators to trigger manual synchronization with the external match API.

#### Scenario: Operator triggers sync
- **WHEN** an authorized operator triggers synchronization
- **THEN** the system runs the sync, stores sync results, and records an audit event

### Requirement: Configure automatic synchronization
The system SHALL let authorized operators enable or disable automatic synchronization and select a supported interval.

#### Scenario: Scheduled synchronization becomes due
- **WHEN** the protected scheduler calls the sync endpoint after the persisted next-run time
- **THEN** the system claims one execution, updates matches, records source/status/error telemetry, and schedules the next run

#### Scenario: Scheduler calls before the next run
- **WHEN** the protected scheduler calls the sync endpoint before the persisted next-run time
- **THEN** the system skips synchronization without duplicating work

### Requirement: Preserve API source health
The system SHALL distinguish a healthy primary API response from degraded backup data and a failed synchronization.

#### Scenario: Primary API fails and backup is available
- **WHEN** the external API cannot provide valid games or teams and local backup data is available
- **THEN** synchronization remains operational but is recorded as degraded with the backup source and failure detail

### Requirement: Convert venue-local kickoff times
The system SHALL convert API wall-clock times to UTC using the IANA time zone associated with each stadium.

#### Scenario: Mexico City opening match is synchronized
- **WHEN** the API returns `06/11/2026 13:00` for the Mexico City stadium
- **THEN** the stored instant is `2026-06-11T19:00:00.000Z`, displayed as 16:00 in Sao Paulo

### Requirement: Correct match score and status
The system SHALL allow authorized operators to correct match score and status with validation and audit metadata.

#### Scenario: Operator corrects finished match score
- **WHEN** an authorized operator submits valid score and status values for a match with a reason
- **THEN** the system updates the match, processes affected scoring, and records an audit event

#### Scenario: Operator submits invalid score
- **WHEN** an authorized operator submits a negative or non-integer score
- **THEN** the system rejects the correction without changing the match
