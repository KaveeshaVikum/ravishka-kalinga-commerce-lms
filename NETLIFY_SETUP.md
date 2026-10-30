# Netlify and Firebase setup

The site uses Firebase Authentication for Google sign-in and phone verification, with the existing Express/tRPC API running through `netlify/functions/api.ts`. The `/api/*` rewrite is configured in `netlify.toml`. The old Manus OAuth flow remains an optional fallback when its settings are present.

## Firebase project setup

1. In Firebase Console, create or select a project and add a Web app. Copy the web-app `apiKey`, `authDomain`, `projectId`, and `appId` values.
2. In **Authentication → Sign-in method**, enable **Google** and **Phone**. For phone sign-in, set the SMS region policy to the countries you intend to serve.
3. In **Authentication → Settings → Authorized domains**, add the production Netlify domain and any custom domain used by students. Add preview domains only if you plan to test sign-in on deploy previews.
4. In Firebase **Authentication → Users**, sign in once with the account that should administer the LMS and copy its Firebase UID.

## Netlify environment variables

Add these to the Netlify site for the production deploy context (and any preview context where you want sign-in to work):

| Variable               | Purpose                                                                | Secret?                        |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| `FIREBASE_API_KEY`     | Firebase web-app key exposed to the browser                            | No; public Firebase config     |
| `FIREBASE_AUTH_DOMAIN` | Firebase web-app auth domain                                           | No                             |
| `FIREBASE_PROJECT_ID`  | Firebase project identity used by the client and server token verifier | No                             |
| `FIREBASE_APP_ID`      | Firebase web-app identifier                                            | No                             |
| `OWNER_FIREBASE_UID`   | Firebase UID that receives the LMS admin role                          | Treat as an account identifier |
| `DATABASE_URL`         | MySQL-compatible LMS database connection                               | Yes                            |

The API verifies Firebase ID tokens against Firebase's published signing certificates and validates their project, issuer, audience, signature, and time claims. No Firebase service-account private key is needed for this verification path. The MySQL database is still required: without it, Firebase can authenticate a browser user, but the LMS cannot persist that student or load their courses, profile, enrollments, assignments, or receipts.

## Optional integrations

The legacy Manus OAuth fallback can remain available by configuring `MANUS_PROJECT_ID`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET`, and `OWNER_OPEN_ID`. File uploads for receipts and lesson recordings also require `MANUS_API_URL` and `MANUS_API_KEY`.

## Database migration

After `DATABASE_URL` points to the intended database, run `pnpm db:migrate` once to apply the committed migrations for student address fields, assignments, and the longer provider-prefixed Firebase UID. The address migration may mark profiles with missing address data as incomplete so those students are prompted to finish their profile. Review the target database before applying migrations.

After configuration and migration, deploy the branch and verify `/api/health`, Google sign-in, phone verification on the authorized domain, student profile save, assignment loading, and admin authorization for the configured Firebase UID.
