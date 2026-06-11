## ADDED Requirements

### Requirement: Select a scoring preset
The system SHALL offer predefined scoring presets and copy their concrete values into the league at creation time.

#### Scenario: Use the standard preset
- **WHEN** the creator selects the COPA-ANT standard preset
- **THEN** the review step displays and stores the standard exact, difference, winner, draw, window, and edit values

### Requirement: Validate custom scoring
The system SHALL validate custom point values, prediction windows, edit limits, dates, and scoring start matchday using explicit allowed ranges.

#### Scenario: Reject negative points
- **WHEN** the creator submits a negative scoring value
- **THEN** the system rejects the request with a field-specific validation error

### Requirement: Lock competitive rules
The system SHALL lock scoring values and prediction timing when the league receives its first prediction.

#### Scenario: Edit locked rules
- **WHEN** an administrator attempts to change competitive rules after the first prediction
- **THEN** the system rejects the change while continuing to allow safe metadata edits

### Requirement: Enforce membership before prediction
The system SHALL require active league membership before accepting a custom-league prediction.

#### Scenario: Predict without membership
- **WHEN** an authenticated non-member submits a prediction for a custom league
- **THEN** the system rejects the prediction and does not create membership

### Requirement: Scope league statistics
The system SHALL calculate prediction statistics only from predictions in the requested league.

#### Scenario: View match sentiment
- **WHEN** a member requests statistics for a match in a league
- **THEN** percentages and totals contain only predictions from that league
