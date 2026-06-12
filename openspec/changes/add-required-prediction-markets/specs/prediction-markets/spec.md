## ADDED Requirements

### Requirement: Required independent prediction markets
The system SHALL require each saved match prediction to include an exact score, a result pick, a total-goals pick, and a both-teams-to-score pick when those markets are active for the league.

#### Scenario: Player saves a complete prediction
- **WHEN** a player submits home score, away score, result pick, total-goals pick, and both-teams-to-score pick for an editable match
- **THEN** the system persists all submitted market values on the prediction

#### Scenario: Player submits an incomplete prediction
- **WHEN** a player tries to save an editable match without one or more required market values
- **THEN** the system rejects the save and explains which required prediction information is missing

### Requirement: Independent market consistency
The system SHALL treat exact score, result, total goals, and both-teams-to-score as independent user picks.

#### Scenario: Player submits contradictory market picks
- **WHEN** a player submits an exact score of 2x1, result pick of draw, total-goals pick of Under 1.5, and both-teams-to-score pick of no
- **THEN** the system accepts the prediction if all values are valid and the match is editable

#### Scenario: Contradictory picks are scored independently
- **WHEN** a finished match is scored for a prediction whose markets contradict each other
- **THEN** the system awards points for each market that independently matches the final result and awards no points for each market that does not match

### Requirement: Result market
The system SHALL support a required result market with home win, draw, and away win choices.

#### Scenario: Home result pick wins
- **WHEN** the player picked home win and the final home score is greater than the final away score
- **THEN** the result market is scored as correct

#### Scenario: Draw result pick wins
- **WHEN** the player picked draw and the final home score equals the final away score
- **THEN** the result market is scored as correct

#### Scenario: Away result pick wins
- **WHEN** the player picked away win and the final home score is less than the final away score
- **THEN** the result market is scored as correct

### Requirement: Total-goals market catalog
The system SHALL support a fixed required total-goals market catalog with Over 1.5, Over 2.5, Over 3.5, Over 4.5, Over 5.5+, Under 1.5, Under 2.5, Under 3.5, Under 4.5, and Under 5.5 choices.

#### Scenario: Total-goals options are available
- **WHEN** a player edits an open match prediction
- **THEN** the total-goals selector offers every supported Over and Under option

#### Scenario: Unsupported total-goals option is submitted
- **WHEN** a prediction save request includes a total-goals value outside the supported catalog
- **THEN** the system rejects the save without changing the prediction

### Requirement: Open-ended Over 5.5+
The system SHALL treat Over 5.5+ as an open-ended highest total-goals market that wins for any match with 6 or more total goals.

#### Scenario: Match has exactly six goals
- **WHEN** the player picked Over 5.5+ and the final match total is 6 goals
- **THEN** the total-goals market is scored as correct

#### Scenario: Match has more than six goals
- **WHEN** the player picked Over 5.5+ and the final match total is greater than 6 goals
- **THEN** the total-goals market is scored as correct

#### Scenario: Match has five or fewer goals
- **WHEN** the player picked Over 5.5+ and the final match total is 5 goals or fewer
- **THEN** the total-goals market is scored as incorrect

### Requirement: Under total-goals scoring
The system SHALL score Under total-goals picks as correct when the final total goals are less than or equal to the selected threshold bucket.

#### Scenario: Under 1.5 wins
- **WHEN** the player picked Under 1.5 and the final match total is 0 or 1 goal
- **THEN** the total-goals market is scored as correct

#### Scenario: Under 5.5 wins
- **WHEN** the player picked Under 5.5 and the final match total is 0, 1, 2, 3, 4, or 5 goals
- **THEN** the total-goals market is scored as correct

#### Scenario: Under pick loses above threshold
- **WHEN** the player picked Under 2.5 and the final match total is 3 or more goals
- **THEN** the total-goals market is scored as incorrect

### Requirement: Both-teams-to-score market
The system SHALL support a required both-teams-to-score market with yes and no choices.

#### Scenario: Both teams score yes wins
- **WHEN** the player picked yes and both final scores are greater than 0
- **THEN** the both-teams-to-score market is scored as correct

#### Scenario: Both teams score no wins
- **WHEN** the player picked no and at least one final score is 0
- **THEN** the both-teams-to-score market is scored as correct

### Requirement: Saldo replacement in player-facing rules
The system SHALL present total-goals scoring in player-facing prediction and rules surfaces instead of goal-difference or saldo scoring.

#### Scenario: Player views Palpites rules
- **WHEN** the player opens the Palpites page for a league using the new markets
- **THEN** the rules identify the total-goals market and do not label it as saldo

#### Scenario: Player views a prediction card
- **WHEN** the player views an editable match card
- **THEN** the card shows a total-goals selector rather than a saldo action or saldo explanation

### Requirement: Mobile prediction card layout
The system SHALL provide a mobile prediction card that keeps team identity, exact score, result, total goals, both-teams-to-score, and the save action readable without horizontal overflow.

#### Scenario: Player views a mobile prediction card
- **WHEN** the player opens Palpites on a 375px viewport
- **THEN** the card displays each team's badge or logo with the country name, exact-score inputs, compact market selectors, and the save action without overlapping controls

#### Scenario: Player views the card on a narrow mobile viewport
- **WHEN** the player opens Palpites on a 320px viewport
- **THEN** the card remains usable without page zoom or horizontal scrolling

### Requirement: Long team name handling
The system SHALL constrain long team names in mobile prediction cards so the overall card layout remains complete and visually stable.

#### Scenario: Team names are long
- **WHEN** an open match contains one or more long country names
- **THEN** the card reduces or truncates the displayed names within the team area before allowing disruptive multi-line wrapping

#### Scenario: Full team name remains accessible
- **WHEN** a displayed team name is visually shortened
- **THEN** the full translated team name remains available through accessible text or equivalent metadata
