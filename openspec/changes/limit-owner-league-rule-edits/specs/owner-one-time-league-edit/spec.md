## ADDED Requirements

### Requirement: Offer one owner edit after creation
The system SHALL allow the league owner to edit the league name and competitive rules exactly once after league creation, when existing validation and prediction-lock constraints permit the requested change.

#### Scenario: Owner has not used the edit
- **WHEN** the owner opens the league edit surface before using the one-time edit
- **THEN** the system shows the edit action as available and indicates that only one saved edit is allowed

#### Scenario: Owner saves the edit
- **WHEN** the owner submits valid name or rule changes through the one-time edit flow
- **THEN** the system saves the changes and records the edit allowance as consumed with timestamp and actor

### Requirement: Confirm before consuming the edit
The system SHALL show a confirmation modal before the owner can submit the one-time edit.

#### Scenario: Owner clicks edit for the first time
- **WHEN** the owner activates the edit action while the allowance is unused
- **THEN** the system opens a modal explaining in Brazilian Portuguese that the edit can be saved only once and future edits will be locked

#### Scenario: Owner cancels the modal
- **WHEN** the owner cancels the confirmation modal without submitting changes
- **THEN** the system leaves the edit allowance unused

### Requirement: Lock owner edits after use
The system SHALL block additional owner edits after the one-time edit allowance has been consumed.

#### Scenario: Owner tries to edit again
- **WHEN** the owner opens the league edit surface after the allowance has been consumed
- **THEN** the system displays a locked/cadeado state and does not expose a submit action for owner edits

#### Scenario: Owner bypasses the UI
- **WHEN** the owner submits a direct request after the allowance has been consumed
- **THEN** the server rejects the request and leaves the league unchanged

### Requirement: Preserve prediction-based rule locks
The system SHALL continue to block competitive rule changes when existing prediction-based lock conditions apply.

#### Scenario: Predictions already exist
- **WHEN** the owner attempts to change competitive rules after predictions have locked the rules
- **THEN** the system rejects the rule changes even if the one-time owner edit allowance is unused

### Requirement: Keep Admin governance independent
The system SHALL NOT apply the owner one-time edit limit to platform Admin governance actions.

#### Scenario: Platform Admin edits through Admin panel
- **WHEN** an authorized platform Admin edits league rules through Admin governance
- **THEN** the system applies Admin authorization and audit rules without consuming or requiring the owner one-time edit allowance
