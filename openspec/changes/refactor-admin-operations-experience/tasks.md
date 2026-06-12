## 1. Admin Experience Refactor

- [x] 1.1 Read local Next.js 16 App Router docs for layouts/pages, Server Components, Server Actions/forms, and CSS before editing.
- [x] 1.2 Add reusable admin UI components for page headers, panels, metrics, status badges, empty states, and metadata.
- [x] 1.3 Refactor `/admin` layout with active navigation, role identity, mobile behavior, and app return link.
- [x] 1.4 Refactor admin overview with metrics, API health, quick actions, and recent audit.
- [x] 1.5 Refactor reset queue, users, leagues, matches/API, and audit pages with clearer filters, rows, grouped actions, and empty states.
- [x] 1.6 Separate destructive operations from routine admin actions in the UI.
- [x] 1.7 Update scoped admin CSS while preserving unrelated player/profile styles.

## 2. Verification

- [x] 2.1 Run `npm run lint`.
- [x] 2.2 Run `npm run build`.
- [x] 2.3 Run focused test retry for the timed-out integration test.
- [ ] 2.4 Run full `npm run test` successfully without integration timeout.
- [ ] 2.5 Perform browser visual QA for `/admin` routes.
- [x] 2.6 Run OpenSpec strict validation.
