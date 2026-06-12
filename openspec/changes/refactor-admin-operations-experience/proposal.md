## Why

The platform admin area already exposes the required operations, but the UI is still close to a first-pass implementation: dense inline forms, weak active navigation, destructive actions mixed with routine edits, and limited operational hierarchy. Admins need a cockpit that is faster to scan, safer to operate, and more consistent across desktop and mobile.

## What Changes

- Refactor `/admin` into a focused operations cockpit with reusable admin UI primitives.
- Add active admin navigation, clearer identity context, mobile-friendly shell behavior, and a direct return path to the app.
- Rework the admin overview around metrics, sync health, pending work, quick actions, and recent audit events.
- Rework reset, user, league, match/API, and audit pages around scannable rows, grouped actions, clearer filters, and empty states.
- Separate destructive operations from routine moderation and editing flows.
- Preserve the existing admin authorization, Server Actions, service boundaries, and audit logging.

## Impact

- Affected UI code: `src/app/admin/**`, `src/components/admin/**`, and scoped admin CSS in `src/app/globals.css`.
- Backend contracts remain unchanged: roles, permissions, data services, Server Actions, and audit writes are preserved.
- Verification includes lint, tests, build, visual review of the admin routes, and OpenSpec validation.
