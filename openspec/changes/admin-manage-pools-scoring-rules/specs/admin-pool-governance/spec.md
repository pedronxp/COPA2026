## ADDED Requirements

### Requirement: Inspect bolao governance details
The system SHALL allow authorized platform admins to inspect a selected bolao's identity, owner, lifecycle status, members, scoring rules, prediction rules, rule lock state, point-entry summary, and recent audit activity.

#### Scenario: Admin opens a bolao detail
- **WHEN** an authorized admin opens an admin detail page for a bolao
- **THEN** the system displays the bolao's current rules, member standings, pending and published point totals, and available corrective actions

#### Scenario: Admin inspects the principal bolao
- **WHEN** an authorized admin opens the principal bolao with id `global`
- **THEN** the system labels it as the default bolao and shows that its visible aggregate score source is the user score table

### Requirement: Edit bolao scoring rules
The system SHALL allow authorized platform admins to edit scoring and prediction rules for the principal bolao and custom boloes using the same validation ranges as league creation.

#### Scenario: Admin edits custom bolao rules
- **WHEN** an authorized admin submits valid scoring rule changes with a reason and an impact mode
- **THEN** the system updates the selected bolao rules and records an audit event with before rules, after rules, reason, and impact mode

#### Scenario: Admin edits principal bolao rules
- **WHEN** an authorized admin submits valid scoring rule changes for bolao id `global`
- **THEN** the system updates the principal bolao rules without allowing the bolao to be deleted

#### Scenario: Admin submits invalid rule values
- **WHEN** an authorized admin submits negative points, an invalid edit limit, or an invalid prediction window
- **THEN** the system rejects the change with a field-specific validation error and does not change the bolao rules

### Requirement: Control rule-change score impact
The system SHALL require admins to choose whether a scoring-rule edit applies only to future scoring or recomputes already scored predictions for the selected bolao.

#### Scenario: Future-only rule edit
- **WHEN** an authorized admin saves a rule edit with future-only impact
- **THEN** the system preserves existing point entries and applies the new rules only when future scoring is processed

#### Scenario: Recompute scored predictions
- **WHEN** an authorized admin saves a rule edit with recompute impact
- **THEN** the system recalculates processed predictions for the selected bolao and updates affected aggregate standings according to whether the bolao is principal or custom

### Requirement: Delete optional scoring rules
The system SHALL allow authorized platform admins to delete optional scoring rules by disabling their point values while preserving required scoring and prediction fields.

#### Scenario: Admin deletes both-score bonuses
- **WHEN** an authorized admin deletes both-teams-to-score bonus rules with a reason
- **THEN** the system sets the relevant bonus point values to zero and records the deletion in the admin audit log

#### Scenario: Admin attempts to delete required base scoring
- **WHEN** an authorized admin attempts to delete required exact, difference, winner, draw, window, or edit-limit rules
- **THEN** the system requires replacing them with valid values or a preset reset instead of removing them

### Requirement: Reset a user's bolao score
The system SHALL allow authorized platform admins to reset a selected user's score to zero for either the principal bolao or a selected custom bolao membership.

#### Scenario: Admin resets principal bolao score
- **WHEN** an authorized admin resets a user's score in the principal bolao with a reason
- **THEN** the system sets that user's global points, streak, and misses to zero and records the previous values in the audit log

#### Scenario: Admin resets custom bolao score
- **WHEN** an authorized admin resets a user's score in a custom bolao with a reason
- **THEN** the system sets the matching membership's points, pending points, exact-score streak, and best exact-score streak to zero and records the previous values in the audit log

#### Scenario: Admin resets missing membership
- **WHEN** an authorized admin attempts to reset a custom bolao score for a user who is not an active member
- **THEN** the system rejects the reset without changing user or bolao scores

### Requirement: Remove a specific user from a bolao
The system SHALL allow authorized platform admins to remove an eligible user from a selected custom bolao without deleting the user's platform account.

#### Scenario: Admin removes custom bolao member
- **WHEN** an authorized admin removes an active non-owner member from a custom bolao with a reason
- **THEN** the system removes that membership, clears related pending join requests, preserves the user account, and records the action in the audit log

#### Scenario: Admin attempts to remove protected member
- **WHEN** an authorized admin attempts to remove the owner from a bolao or remove a user from the principal bolao as if it were a membership
- **THEN** the system rejects the action and leaves membership and user records unchanged

### Requirement: Preserve admin authorization and auditability
The system SHALL keep all bolao governance mutations behind server-side admin authorization and immutable audit logging.

#### Scenario: Unauthorized user submits governance action
- **WHEN** a non-admin or insufficiently privileged user submits a bolao governance mutation
- **THEN** the system rejects the request before reading or mutating privileged bolao data

#### Scenario: Governance mutation succeeds
- **WHEN** an authorized admin action changes rules, resets score, recomputes scoring, or removes a member
- **THEN** the system appends an audit log entry with actor, action, entity type, entity id, summary, metadata, and timestamp
