## Why

League creators need a controlled way to correct the group name and rules after creation without allowing repeated competitive changes. The product also needs consistent Brazilian Portuguese copy with correct accents and symbols, because mojibake strings such as `BolÃ£o` and missing currency/symbol rendering make the interface feel broken.

## What Changes

- Allow the league owner to edit the group name and competitive rules exactly once after creation, subject to existing validation and prediction-lock constraints.
- Show a confirmation modal before the one allowed owner edit, explaining in Brazilian Portuguese that this action can only be used once and cannot be repeated.
- After the owner edit is used, block further owner edits with a lock/cadeado state and a clear Brazilian Portuguese message.
- Keep platform Admin governance separate: platform admins can still use Admin tools according to their permissions and audit rules.
- Persist whether the owner edit allowance has been consumed, including who used it and when.
- Normalize user-facing Portuguese copy in league/admin flows to Brazilian Portuguese with correct accents, symbols, and spelling.

## Capabilities

### New Capabilities
- `owner-one-time-league-edit`: Owner-facing one-time edit allowance for league name and rules, including modal warning, locked state, and persistence.
- `pt-br-copy-quality`: Brazilian Portuguese copy quality requirements for accents, symbols, and spelling across affected league/admin screens.

### Modified Capabilities
- None.

## Impact

- Affected data: `League` will need fields to track owner edit usage, timestamp, and actor.
- Affected UI: league detail/settings/edit surfaces, create/review copy if reused, and relevant admin/league components with broken Portuguese text.
- Affected services/actions: `src/lib/league-service.ts`, league update routes/actions, validation helpers, and tests.
- No new third-party dependencies are expected.
