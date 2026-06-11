## ADDED Requirements

### Requirement: Record privileged admin actions
The system SHALL record privileged admin actions with actor, action, entity type, entity id, summary, metadata, and timestamp.

#### Scenario: Admin mutation succeeds
- **WHEN** a privileged admin mutation succeeds
- **THEN** the system appends an audit log entry describing the action

### Requirement: Browse audit events
The system SHALL allow authorized admins to browse recent audit events and filter by action or entity type.

#### Scenario: Admin filters audit log by entity type
- **WHEN** an authorized admin filters the audit log by entity type
- **THEN** the system displays matching audit events in descending timestamp order

### Requirement: Prevent audit edits from admin UI
The system SHALL NOT provide an admin UI action to edit or delete audit events.

#### Scenario: Admin views audit event
- **WHEN** an authorized admin views an audit event
- **THEN** the system displays the recorded event without edit or delete controls
