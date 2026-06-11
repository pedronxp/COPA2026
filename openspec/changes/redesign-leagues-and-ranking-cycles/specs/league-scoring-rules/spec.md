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

### Requirement: Score outcome variants independently
The system SHALL allow each league to configure distinct values for a correct home win, draw, and away win.

#### Scenario: Predict the correct away winner
- **WHEN** a participant predicts an away win and the away team wins without a more precise score-tier match
- **THEN** the participant receives the league's configured away-win points

### Requirement: Award both-teams-to-score bonuses
The system SHALL derive whether both teams score from the predicted and actual score and award the configured yes or no bonus when they match.

#### Scenario: Both teams score
- **WHEN** the prediction and result both contain at least one goal for each team
- **THEN** the scoring result includes the configured both-score-yes bonus in addition to the single applicable precision tier

#### Scenario: At least one team does not score
- **WHEN** the prediction and result both indicate that at least one team finishes without scoring
- **THEN** the scoring result includes the configured both-score-no bonus

### Requirement: Track league exact-score streaks
The system SHALL track current and best consecutive exact-score streaks separately for each league member.

#### Scenario: Member reaches three exact scores
- **WHEN** a member records three consecutive exact scores in finished league matches
- **THEN** the ranking marks the member as "Em alta" with an animated fire indicator

### Requirement: Explain score composition
The system SHALL show all configured score tiers and bonuses during league creation, review, and rule inspection.

#### Scenario: Creator reviews custom rules
- **WHEN** the creator reaches the review step
- **THEN** the interface lists home, draw, away, exact, difference, and both-score values with readable contrast
