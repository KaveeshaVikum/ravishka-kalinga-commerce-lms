# Ravishka Kalinga Commerce LMS — Delivery TODO

## Student registration and authenticated learning experience

- [x] Students can sign in and sign out using the project’s real Manus OAuth login flow; the existing account record is created/updated in the managed database.
- [x] Students can view a dashboard with enrolled courses, payment approval status, available lessons, announcements, and a personal payment history.
- [x] Students can browse the Commerce – Business and Accounting lessons and only open lesson recordings when the matching enrollment is approved.

## Manual payment and receipt verification

- [x] Students can submit a manual payment receipt as an image or document with optional amount and payment reference details.
- [x] Each receipt submission shows a clear pending, approved, or rejected status to the student.
- [x] Admins can review submitted receipts, approve or reject them, record a rejection note, and update the student’s payment/access status.

## Announcements

- [x] Students can view lesson updates and general announcements in an announcements area.
- [x] Admins can create and publish announcements.

## Protected administration portal

- [x] The student-facing LMS is separate from an admin-only `/admin` portal protected by the application admin role.
- [x] Admins can search and view student accounts and manage course access through receipt review.
- [x] Admins can create course/lesson drafts, publish or unpublish courses and lessons, and set lesson ordering when creating a lesson.
- [x] Only admins can upload lesson recordings and attach them to lessons through managed storage.
- [ ] Full inline editing of existing course text, student profile details, and drag-and-drop lesson reordering can be added in the next iteration.

## Brand and delivery

- [x] The app prominently uses the Ravishka Kalinga name and the user-provided black/red logo style.
- [x] A stable `/manus-routes.json` route manifest, health endpoint, app logo metadata, and production build are configured.
- [ ] Custom domain connection remains open because no domain name has been selected yet.

## Current implementation state

- [x] Managed React/Express/tRPC/Drizzle project initialized with Server and Database enabled.
- [x] User-provided logo uploaded to project storage and registered as project branding.
- [x] TypeScript diagnostics registered for the project.
- [x] Default Commerce — Business and Accounting course, three starter lessons, and a welcome announcement seeded.
- [x] TypeScript check, production build, health endpoint, route manifest, and desktop/mobile preview checks completed.
- [x] Final checkpoint committed and pushed to the managed project’s canonical `main` branch. Publication/custom domain connection is intentionally left for the next step because no domain name has been selected.
