## ADDED Requirements

### Requirement: Dashboard acts as the command center
The dashboard SHALL present the user's active league context, current standing, points, next actionable match, and primary action to submit predictions.

#### Scenario: Dashboard hero
- **WHEN** an authenticated user opens `/dashboard`
- **THEN** the first viewport includes greeting/context, user position or points, next match context, and a primary Palpitar action

### Requirement: Dashboard summarizes progress
The dashboard SHALL show prediction progress using counts and a visual progress indicator.

#### Scenario: Prediction progress visible
- **WHEN** the dashboard has scheduled matches and saved predictions
- **THEN** it shows saved count, total relevant matches, percentage completion, and a visual progress bar

### Requirement: Dashboard exposes ranking preview
The dashboard SHALL include a compact ranking preview and make the full Ranking page reachable.

#### Scenario: Ranking preview
- **WHEN** league members exist
- **THEN** the dashboard shows the leader or top members and provides a path to the full Ranking page

### Requirement: Dashboard supports responsive layouts
The dashboard SHALL adapt from multi-column desktop composition to single-column mobile composition without losing actions or readable content.

#### Scenario: Mobile dashboard
- **WHEN** the viewport width is 375px
- **THEN** dashboard modules stack vertically, buttons remain tappable, and no horizontal page overflow is introduced

### Requirement: Dashboard uses motion responsibly
The dashboard SHALL use subtle motion for progress and status changes while respecting reduced-motion preferences.

#### Scenario: Reduced motion preference
- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** nonessential dashboard animation is disabled or minimized
