## ADDED Requirements

### Requirement: List password reset requests
The system SHALL allow authorized support admins to list password reset requests with user identity, status, creation time, and review metadata.

#### Scenario: Support admin filters reset queue
- **WHEN** a support admin selects a reset request status filter
- **THEN** the system displays only reset requests matching that status

### Requirement: Approve password reset requests
The system SHALL allow authorized support admins to approve pending password reset requests and apply the proposed password hash to the target user.

#### Scenario: Approve pending reset request
- **WHEN** an authorized support admin approves a pending reset request with a reason
- **THEN** the target user's password hash is updated, the request is marked approved, reviewer metadata is stored, and an audit event is recorded

### Requirement: Reject password reset requests
The system SHALL allow authorized support admins to reject pending password reset requests without changing the target user's password hash.

#### Scenario: Reject pending reset request
- **WHEN** an authorized support admin rejects a pending reset request with a reason
- **THEN** the request is marked rejected, reviewer metadata is stored, and an audit event is recorded
