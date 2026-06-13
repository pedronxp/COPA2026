## 1. Data and Domain

- [x] 1.1 Add nullable `League` fields to track owner edit consumption, timestamp, and actor.
- [x] 1.2 Generate a Prisma migration for the owner edit tracking fields.
- [ ] 1.3 Expose owner edit availability, used timestamp, and lock reason in league detail/projection data.
- [ ] 1.4 Add domain helpers to determine whether an owner edit can be used, is blocked by prediction locks, or is already consumed.

## 2. Owner Edit Flow

- [ ] 2.1 Update the owner-facing league update service to consume the one-time edit in the same transaction as the saved changes.
- [ ] 2.2 Reject direct owner edit requests after the allowance is consumed.
- [ ] 2.3 Preserve existing competitive-rule prediction locks and return a clear blocked reason when they apply.
- [ ] 2.4 Ensure platform Admin governance actions do not consume or require the owner edit allowance.

## 3. Interface

- [ ] 3.1 Add an owner edit entry point for eligible league owners.
- [ ] 3.2 Build the confirmation modal with Brazilian Portuguese copy explaining the one-time edit rule.
- [ ] 3.3 Show a locked/cadeado state after the owner edit is consumed.
- [ ] 3.4 Hide or disable owner submit actions when editing is locked, while keeping read-only rule inspection available.

## 4. Brazilian Portuguese Copy

- [ ] 4.1 Audit affected league/admin files for mojibake text such as `Ã`, `Â`, and broken Portuguese words.
- [ ] 4.2 Replace affected user-facing strings with correct Brazilian Portuguese accents, spelling, and symbols.
- [ ] 4.3 Add focused assertions or snapshots for key modal/lock copy where practical.

## 5. Verification

- [ ] 5.1 Add tests for first owner edit success, second owner edit rejection, modal/lock state data, and prediction-lock precedence.
- [ ] 5.2 Add regression tests that Admin governance does not consume owner edit allowance.
- [ ] 5.3 Run Prisma generation/migration checks, typecheck, relevant tests, build, and OpenSpec validation.
