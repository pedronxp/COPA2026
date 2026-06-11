## 1. Data Model And Authorization

- [x] 1.1 Add Prisma fields/models for admin roles, account moderation, reset review metadata, session revocation, and admin audit logs
- [x] 1.2 Generate Prisma client and update seed data with a bootstrap super admin path
- [x] 1.3 Implement centralized admin role, permission, account-status, and audit helpers
- [x] 1.4 Enforce banned/suspended account state in login and API session checks

## 2. Admin Data And Mutations

- [x] 2.1 Implement admin dashboard summary and sync health data services
- [x] 2.2 Implement password reset queue listing, approval, rejection, reviewer metadata, and audit logging
- [x] 2.3 Implement user search, sanction/reactivation, session revocation, and moderation audit logging
- [x] 2.4 Implement league search, rename/status operations, rule summaries, and audit logging
- [x] 2.5 Implement match/API operations for sync inspection, manual sync, score/status correction, scoring recalculation, and audit logging
- [x] 2.6 Implement audit log browsing and filtering

## 3. Admin User Interface

- [x] 3.1 Build protected `/admin` layout, navigation, and access-denied handling
- [x] 3.2 Build admin dashboard with metrics, queue links, and API health
- [x] 3.3 Build reset queue, users, leagues, match/API operations, and audit pages with focused forms
- [x] 3.4 Add scoped admin CSS for responsive operational tables, forms, and status states

## 4. Verification

- [x] 4.1 Add focused tests for admin permissions, sanctions, and audit logging
- [x] 4.2 Run Prisma generation, lint, tests, production build, and OpenSpec validation
