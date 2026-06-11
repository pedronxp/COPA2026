## ADDED Requirements

### Requirement: Calculate points once per prediction
The system SHALL create one auditable point entry for each scored prediction and SHALL make repeated scoring idempotent.

#### Scenario: Retry a finished match
- **WHEN** scoring runs more than once for the same prediction
- **THEN** the system retains one ledger entry and does not increment member totals twice

### Requirement: Separate pending and published points
The system SHALL add newly calculated custom-league points to pending totals until the configured publication cycle is released.

#### Scenario: Score before publication
- **WHEN** a match finishes inside an incomplete round-based cycle
- **THEN** member pending points increase while the visible ranking remains unchanged

### Requirement: Configure group-stage publication
The system SHALL support publication after each match, after each round, every two rounds, every three rounds, at phase close, or manually.

#### Scenario: Publish every two rounds
- **WHEN** group rounds one and two are complete for a league configured for two-round publication
- **THEN** the system publishes eligible pending entries and creates a ranking snapshot for that cycle

### Requirement: Configure knockout publication
The system SHALL support publication after each match, after each knockout stage, or manually.

#### Scenario: Publish a knockout stage
- **WHEN** all known matches in a configured knockout stage finish
- **THEN** the system publishes the stage's pending points and stores a ranking snapshot

### Requirement: Respect scoring start round
The system SHALL exclude group-stage matches before the league's configured scoring start matchday.

#### Scenario: Start from round two
- **WHEN** a league starts scoring at matchday two and a matchday-one result is processed
- **THEN** no custom-league point entry or member total change is produced for that league

### Requirement: Correct published scores auditably
The system SHALL record score corrections and adjust pending or published totals without deleting the original audit history.

#### Scenario: Correct a published result
- **WHEN** an official match result changes after its cycle was published
- **THEN** the system records an adjustment entry and applies the point difference to the published ranking

### Requirement: Display publication state
The system SHALL show the last publication time, next expected publication, and whether calculated points are pending.

#### Scenario: Ranking has pending points
- **WHEN** a member opens a ranking with an incomplete publication cycle
- **THEN** the view indicates that points are being calculated without revealing hidden totals
