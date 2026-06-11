## ADDED Requirements

### Requirement: Password reset management is authorized
The system SHALL restrict password reset request listing, approval, and rejection to authorized operational users.

#### Scenario: Unauthorized reset request listing
- **WHEN** an authenticated non-authorized user requests the reset request list
- **THEN** the system rejects the request with an authorization error

#### Scenario: Authorized reset request approval
- **WHEN** an authorized operational user approves a pending reset request
- **THEN** the target user's password hash is updated and the request is marked approved

### Requirement: Auth endpoints avoid account enumeration
The system SHALL avoid revealing whether a submitted email belongs to an account in public auth recovery flows.

#### Scenario: Forgot password unknown email
- **WHEN** a user submits an unknown email to the forgot-password flow
- **THEN** the response does not disclose that the email is unknown

### Requirement: Mutating API routes validate input
Mutating API routes SHALL validate request bodies before applying changes.

#### Scenario: Invalid prediction score
- **WHEN** a prediction request includes non-integer or out-of-range scores
- **THEN** the system rejects the request and does not persist the prediction

### Requirement: Sensitive endpoints are abuse-resistant
The system SHALL include abuse-prevention controls for login, registration, and password reset flows.

#### Scenario: Repeated login attempts
- **WHEN** a client repeatedly submits failed login attempts
- **THEN** the system limits or delays further attempts according to the configured policy

### Requirement: Session cookie security is preserved
The system SHALL keep session cookies httpOnly, sameSite protected, secure in production, and scoped to the application path.

#### Scenario: Session creation
- **WHEN** a user logs in or registers successfully
- **THEN** the session cookie is set with httpOnly, sameSite, production secure, expiration, and path attributes
