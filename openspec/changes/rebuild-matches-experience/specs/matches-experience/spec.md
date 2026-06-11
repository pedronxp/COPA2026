## ADDED Requirements

### Requirement: Authenticated matches route
The system SHALL keep `/matches` as an authenticated player route rendered inside the player application shell for the active league.

#### Scenario: Authenticated player opens matches
- **WHEN** an authenticated player navigates to `/matches`
- **THEN** the system displays the rebuilt matches experience inside the player application shell with the active league context visible

#### Scenario: Unauthenticated visitor opens matches
- **WHEN** an unauthenticated visitor navigates to `/matches`
- **THEN** the system requires authentication before showing match predictions

### Requirement: League-aware page summary
The system SHALL show a league-aware summary of prediction progress and rules derived from the active league, matches, and existing predictions.

#### Scenario: Summary shows active league rules
- **WHEN** the matches page loads for an active league
- **THEN** the page displays the league name, prediction window length, edit limit, and scoring values used for that league

#### Scenario: Summary shows match progress counts
- **WHEN** the matches page loads with matches and predictions
- **THEN** the page displays counts for actionable open matches, unsaved matches, saved predictions, upcoming matches, and locked or completed matches

### Requirement: Actionable match filtering
The system SHALL allow players to filter matches by prediction state, date, group, and stage without losing the active league context.

#### Scenario: Player filters open matches
- **WHEN** the player selects the open matches filter
- **THEN** the page displays only scheduled matches whose prediction window is open and whose edit limit has not been reached

#### Scenario: Player filters unsaved matches
- **WHEN** the player selects the unsaved matches filter
- **THEN** the page displays matches that do not have a saved prediction for the active league

#### Scenario: Player filters by group or stage
- **WHEN** the player selects a group or knockout stage filter
- **THEN** the page displays only matches that belong to that group or stage

#### Scenario: Player clears filters
- **WHEN** the player returns to the all matches filter
- **THEN** the page displays the full match set available to the matches experience

### Requirement: Grouped match presentation
The system SHALL present filtered matches in grouped sections that make schedule context clear.

#### Scenario: Matches are grouped by date
- **WHEN** multiple visible matches occur on different dates
- **THEN** the page groups matches under date headings in kickoff order

#### Scenario: Knockout matches are visible
- **WHEN** visible matches include knockout stages
- **THEN** each knockout match displays its stage label even when it does not have a group

#### Scenario: Empty filtered result
- **WHEN** the active filters match no games
- **THEN** the page displays an empty state that explains there are no matches for the selected view

### Requirement: Match row prediction controls
The system SHALL show each match with team identity, kickoff context, prediction window status, saved score state, edit count, league-specific stats, and a save or update action.

#### Scenario: Match has no saved prediction
- **WHEN** a visible match has no prediction for the player in the active league
- **THEN** the match displays empty score inputs and indicates that no prediction is saved

#### Scenario: Match has a saved prediction
- **WHEN** a visible match has an existing prediction for the player in the active league
- **THEN** the match displays the saved score and edit count for that prediction

#### Scenario: Match has league stats
- **WHEN** a visible match has prediction stats for the active league
- **THEN** the match displays the total number of league predictions and the home, draw, and away distribution

#### Scenario: Match stats are unavailable
- **WHEN** a visible match has no stats for the active league
- **THEN** the match remains usable and displays a neutral stats state

### Requirement: Prediction editing rules
The system SHALL enable score editing only when the match is scheduled, inside the active league prediction window, and below the active league edit limit.

#### Scenario: Prediction window is open
- **WHEN** a scheduled match is inside the active league prediction window and the player has edits remaining
- **THEN** the score inputs and save action are enabled

#### Scenario: Prediction window has not opened
- **WHEN** a scheduled match is before the active league prediction window
- **THEN** the score inputs and save action are disabled and the page explains when predictions open

#### Scenario: Prediction window is closed
- **WHEN** a match is within 30 minutes of kickoff, live, or finished
- **THEN** the score inputs and save action are disabled and the page explains that predictions are closed

#### Scenario: Edit limit is reached
- **WHEN** the player has reached the active league edit limit for a match
- **THEN** the score inputs and save action are disabled and the page explains that the edit limit has been reached

### Requirement: Prediction save feedback
The system SHALL provide clear per-match and page-level feedback while saving, after success, and after failure.

#### Scenario: Player saves a valid prediction
- **WHEN** the player enters two valid score values and saves an open match
- **THEN** the system sends the prediction to `/api/predictions` with the match id, home score, away score, and active league id

#### Scenario: Save succeeds
- **WHEN** `/api/predictions` accepts the prediction
- **THEN** the page shows success feedback, marks the match as saved, and refreshes server-backed data

#### Scenario: Save fails
- **WHEN** `/api/predictions` rejects the prediction
- **THEN** the page shows the server-provided error when available and keeps the player's entered scores visible for correction

#### Scenario: Score input is incomplete
- **WHEN** the player tries to save with one or both score inputs empty
- **THEN** the page blocks the request and asks the player to fill both scores

### Requirement: Responsive rebuilt layout
The system SHALL provide a usable rebuilt matches experience on desktop and mobile viewports.

#### Scenario: Desktop viewport
- **WHEN** the player uses `/matches` on a desktop-width viewport
- **THEN** the page shows summary, filters, grouped matches, and prediction controls without overlapping text or controls

#### Scenario: Mobile viewport
- **WHEN** the player uses `/matches` on a mobile-width viewport
- **THEN** the page stacks match details, score inputs, and actions in a readable order without horizontal overflow
