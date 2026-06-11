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

### Requirement: Correct match score and status
The system SHALL allow authorized operators to correct match score and status with validation and audit metadata.

#### Scenario: Operator corrects finished match score
- **WHEN** an authorized operator submits valid score and status values for a match with a reason
- **THEN** the system updates the match, processes affected scoring, and records an audit event

#### Scenario: Operator submits invalid score
- **WHEN** an authorized operator submits a negative or non-integer score
- **THEN** the system rejects the correction without changing the match
