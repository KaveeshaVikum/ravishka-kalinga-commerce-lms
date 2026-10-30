# Netlify backend setup

The site uses the existing Manus OAuth flow and Express/tRPC backend. Netlify must deploy the function in `netlify/functions/api.ts`; the `/api/*` rewrite is configured in `netlify.toml`.

## Required Netlify variables

In the Netlify site's environment variables, configure these for the deploy contexts that should support student sign-in:

| Variable | Purpose | Secret? |
| --- | --- | --- |
| `MANUS_PROJECT_ID` | Manus OAuth application/project ID exposed to the browser | No |
| `MANUS_OAUTH_PORTAL_URL` | Manus sign-in portal URL exposed to the browser | No |
| `MANUS_OAUTH_API_URL` | Server-side OAuth token and user-info API | Treat as configuration |
| `MANUS_JWT_SECRET` | Signs the LMS session cookie | Yes |
| `DATABASE_URL` | MySQL-compatible database connection for students, courses, assignments, receipts, and profiles | Yes |
| `OWNER_OPEN_ID` | Manus user ID that should receive the LMS admin role | Treat as sensitive account identifier |

The project currently has no Netlify database or OAuth variables configured. Do not paste secret values into GitHub or this documentation.

## Optional storage variables

Existing receipt and lesson-recording uploads also require `MANUS_API_URL` and `MANUS_API_KEY`. These are not required just to start OAuth, but upload/review file flows need them.

## Database migration

After setting `DATABASE_URL` to the intended database, run `pnpm db:migrate` once to add student address fields and the assignments table. The migration keeps existing profile data and marks users whose new address fields are empty as needing profile completion again. Review the target database before running migrations; the command changes its schema and profile-completion flags.

After variables are configured and the migration is applied, deploy the branch and verify `/api/health`, OAuth callback, student profile save, and the assignment list on the live site.
