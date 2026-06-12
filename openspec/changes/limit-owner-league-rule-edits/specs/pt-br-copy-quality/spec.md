## ADDED Requirements

### Requirement: Use Brazilian Portuguese with correct encoding
The system SHALL display affected league and admin copy in Brazilian Portuguese with correct UTF-8 accents, spelling, and symbols.

#### Scenario: User views league management copy
- **WHEN** a user views league creation, league detail, league edit, or owner edit lock copy
- **THEN** the system displays readable Brazilian Portuguese such as "Bolão", "Usuário", "Você", "Não", and "pontuação" rather than mojibake text

#### Scenario: Admin views operational copy
- **WHEN** an Admin views affected Admin league governance copy
- **THEN** labels, buttons, warnings, and empty states use correct Brazilian Portuguese accents and spelling

### Requirement: Preserve symbols and numeric meaning
The system SHALL render symbols and numeric/currency-like values without losing or corrupting characters.

#### Scenario: Interface displays symbols
- **WHEN** the interface displays symbols such as currency signs, points, locks, or separators
- **THEN** the displayed text preserves the intended symbol and remains understandable in Brazilian Portuguese

### Requirement: Avoid mixed or broken wording
The system SHALL avoid mixed-language, misspelled, or placeholder-like copy in affected league and admin flows.

#### Scenario: Confirmation modal appears
- **WHEN** the one-time edit confirmation modal appears
- **THEN** the modal title, body, cancel action, and confirm action use polished Brazilian Portuguese and no encoding artifacts
