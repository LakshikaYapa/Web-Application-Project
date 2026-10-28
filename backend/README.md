# Backend API

## Administrator setup (step 1)

Public registration never accepts the admin role. To create an administrator,
set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your ignored `backend/.env` file.
Use any nonempty password up to 128 characters, then run `npm run admin:create`
from `backend/` with MongoDB available. The command refuses to overwrite or
promote existing accounts. Admin accounts do not need public contact details.
Remove `ADMIN_PASSWORD` from `.env` after creating the account.

Sign in through the existing homepage dialog with those credentials. Admins
are sent to `/admin`. Refreshing the page checks the stored session and current
database role through `GET /api/auth/admin`: anonymous sessions receive 401,
non-admins receive 403. Suspended and expired sessions lose access. Sign out
revokes the session. This first dashboard contains account details only;
management features will be added in later steps.

## Registration

`POST /api/auth/register` accepts JSON:

```json
{
  "name": "Example Volunteer",
  "email": "volunteer@example.com",
  "password": "use a long unique passphrase",
  "roles": ["volunteer", "funder"],
  "address": "123 Example Road",
  "nearestTown": "Kandy",
  "phone": "077 123 4567",
  "preferredLanguage": "en"
}
```

- Select one or more distinct public roles: `volunteer`, `help_seeker`, `funder`.
  Send them as a `roles` array, not a `role` string. Empty arrays, duplicates,
  unknown roles and admin selections are rejected.
- Passwords: 15–128 characters; spaces and Unicode are allowed. Passwords are
  hashed with salted scrypt and are never returned or logged.
- Language: optional `en` (default) or `si`.
- Required contact details: address (5–300 characters), nearest town (2–100), and
  a Sri Lankan phone number in local or +94 format. Phone numbers are normalized
  to +94 format; this validates format only, not ownership. Address and phone are
  excluded from default queries and JSON serialization, as well as API responses.
- Existing development accounts created before these fields were required are not
  automatically backfilled; collect their contact details in a future profile flow.
- Extra fields are rejected. Emails are trimmed, lowercased, and uniquely indexed.
- Responses: `201` created, `400` invalid input, `409` email already registered,
  `413` body too large, `429` registration rate limit, `500` internal error.
- Limit: 10 registration attempts per IP per 15 minutes, in memory for the current
  single-process deployment. A shared limiter store and trusted-proxy configuration
  are required before scaling to multiple backend instances.

Successful registration returns an allowlisted user object. It does not sign the
user in. The registration form is available; connecting the sign-in form and
email verification are subsequent steps.
Use HTTPS when deploying. Do not publish private user details in the homepage feed.

Run `npm test` from `backend/`. The API tests exercise HTTP with mocked database
writes; they do not persist users. The unique-index guarantee requires MongoDB;
the server waits for the user index to initialize before listening.

## Existing single-role accounts

Before using existing accounts with the new role format, run `npm run migrate:roles`
from `backend/` for the configured database, or in Docker:

```powershell
docker compose exec backend node src/migrate-user-roles.js
```

The migration copies each recognized legacy `role` into a `roles` array only
when that array is absent. Existing multi-role accounts and legacy role fields
are preserved; rerunning it does not overwrite role selections.

## Login sessions

- `POST /api/auth/login`: JSON `{ "email": "...", "password": "..." }`.
- `GET /api/auth/me`: returns the current user or `401` when not signed in.
- `POST /api/auth/logout`: destroys the session and clears its cookie.

Login and logout requests must include `X-CSRF-Protection: 1`. Browser requests
use the same-origin frontend proxy (no cross-origin CORS access is granted).
Use `credentials: "same-origin"` with fetch and preserve the session cookie.
Login rejects client-supplied roles; permissions come from the stored account.
Passwords, unknown emails, and suspended users share a generic `401` response.
The login limit is 10 attempts per IP per 15 minutes.

Sessions are stored in MongoDB's `sessions` collection, expire after eight hours,
and are regenerated on login. Cookies use `HttpOnly`, `SameSite=Strict`, and
`Path=/api`. User responses are not cached and contain no password or contact data.
`/me` loads current roles/status from the database, so suspensions invalidate
existing sessions. Future protected endpoints must check the account similarly.

Configure a random `SESSION_SECRET` of at least 32 characters and keep it stable
across backend restarts and instances. Generate one locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put it in ignored `backend/.env` for native development. For Compose, set
`SESSION_SECRET` in the root `.env` or shell environment. The Compose fallback
is a known development-only key and must never be used in a deployment.
`SESSION_COOKIE_SECURE=false` permits local HTTP; HTTPS deployments must use
secure cookies (the server default), with the exact trusted reverse proxy
configured before enabling forwarded HTTPS headers. Session configuration is
required by the server; tests inject an isolated in-memory store only.
