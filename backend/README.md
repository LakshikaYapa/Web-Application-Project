# Backend API

## Funder contributions — backend step

`POST /api/contributions` requires an active login session and
`X-CSRF-Protection: 1`. Send multipart form data with repeated `supportTypes`
fields (`financial`, `food_water`, `shelter`, `relief`, `other`), `nearestTown`
(1–100 characters), and a Sri Lankan `phone` number. Optional `notes` supports
1000 characters. Selecting `other` requires `otherSupport` (1–500 characters).
Unknown/duplicate support types and client-supplied owners/statuses are rejected.

For `financial`, include `amount` as a positive decimal LKR string (up to two
decimal places, maximum 9,999,999,999.99) and one file named `receipt`. Amounts
are stored as integer cents (`amountMinor`) with currency `LKR`. Non-financial
contributions must omit both amount and receipt. Receipt files may be JPG, PNG,
WebP or PDF, up to 5 MiB. MIME type and basic file signatures are checked, not
full image/PDF decoding. Invalid files return 400; oversized files return 413.

The server derives ownership from the session and stores one new `contributions`
document, including private receipt binary data and contact details. Default
queries exclude receipts and phone numbers. Nothing is stored before all
validation passes. Each contribution starts as `pending_review`; receipt
submission does not verify or confirm a bank payment. Success returns 201 with
ID, status and creation time only. There is no receipt download endpoint yet.
Other responses: 400 validation, 401 unauthenticated/inactive account, 403 missing
CSRF header, 429 (10 attempts per IP per 15 minutes), 500 save failure.

The funder form remains a UI preview in this step. API tests use mocked database
writes and do not make real payments or persist contributions.

## Volunteer profile — backend step

`PUT /api/volunteers/me` requires an active signed-in account and
`X-CSRF-Protection: 1`. Send JSON using the volunteer form's area IDs:

```json
{
  "nearestTown": "Kandy",
  "areas": {
    "relief": { "skills": ["Packing supplies", "Food preparation"] },
    "transport": { "skills": ["Driving", "Other skills"], "otherSkills": "Bicycle repairs" },
    "other": { "skills": ["Communication"], "otherSupport": "Online coordination" }
  }
}
```

Supported areas are `relief`, `transport`, `community` and `other`. Each selected
area requires at least one distinct skill from its matching options in
`src/validation/volunteer.js`. `Other skills` requires `otherSkills` (1–500
characters). Area `other` requires `otherSupport` (1–200). Non-selected custom
fields must be omitted or empty. Town is required (1–100). Text is trimmed;
unexpected fields, account IDs and availability fields are rejected.

One profile per account is stored in `volunteerprofiles`; saving again replaces
the town and selected support areas. The server derives ownership from the
session and does not change account roles. Startup initializes the unique user
index. Success returns 200 with profile ID and update time. Errors include 400
(validation), 401 (authentication), 403 (CSRF), 409 (concurrent save conflict),
429 (10 attempts per IP per 15 minutes) and 500 (save failure).

The volunteer form sends these selections to the API and displays success or
error feedback. Fields are disabled while saving; failures preserve the entered
details so users can sign in from the header and retry. Saving again replaces
the prior selections. The form loads existing profiles before allowing edits.
`GET /api/volunteers/me` returns the current owner's town and an `areas` object
matching the form, or `profile: null` for a new volunteer. No other user's profile
can be requested. Anonymous/expired/suspended sessions return 401. Responses
use `no-store`. Failed loads block editing and saving; after signing in through
the header, use **Load my volunteer details** to retry. Database writes are mocked
in HTTP tests; live persistence and unique indexes require MongoDB.

## Help requests — backend step

`GET /api/help-requests/mine?page=1` lists only the authenticated user's requests,
newest first, 20 per page. The response contains `requests`, `page` and `hasMore`.
Owner IDs, account details and photo buffers are excluded. Missing/invalid sessions
return 401; invalid page numbers return 400. The `/my-requests` frontend includes
loading, empty and error states, pagination and a refresh button. After signing
in through the header, refresh the list. The list includes photo counts without
loading image buffers. Attached photos appear as lazy-loaded thumbnails; click
one to open it in a new tab.

`GET /api/help-requests/:id/photos/:index` returns an image only to the active,
authenticated owner. Indexes are 0–2. Invalid IDs, absent photos and another
user's request all return 404; missing/expired sessions return 401. Images use
their stored MIME type, `Cache-Control: no-store` and `X-Content-Type-Options:
nosniff`. No public image endpoint is provided.

`POST /api/help-requests` requires an active login session and the header
`X-CSRF-Protection: 1`. Send JSON with `helpType`, `nearestTown` (1–100
characters), `location` (1–300) and `description` (1–2000). Text is trimmed.
Supported help types: `Food and drinking water`, `Shelter`, `Rescue or transport`,
`Medical assistance`, `Other help`.
The request also requires `phone`, a Sri Lankan number in local or +94 format
(for example `077 123 4567`). It is normalized to +94 format and is shown only
in the owner's authenticated request list. Existing requests without phone
numbers remain readable.
Choosing `Other help` reveals a required text field. Send `otherHelp` with
1–200 characters for that category only; the value is saved and shown in the
owner's request list. Other categories must omit `otherHelp`.

The server derives the requester from the session and saves a `pending` request
in MongoDB's `helprequests` collection. Client-supplied owners, statuses and
other extra fields are rejected. Success returns 201 with the request ID,
status, creation time and photo count. Other responses include 400 (invalid fields), 401
(missing, expired or inactive account), 403 (missing CSRF header), 429 (more
than 10 requests per IP per 15 minutes) and 500 (save failure).

The frontend sends multipart requests from `/request-help` and displays the saved
request reference and photo count. Sign in through the page header before submitting.
Optional images use the repeated multipart field `photos`: up to 3 JPG, PNG or
WebP files, maximum 5 MiB each. The server checks MIME types and file signatures;
this is not full image decoding. Invalid uploads return 400 and oversized files
return 413 before any request is saved. JSON text-only requests remain supported.
Photos are stored as binary data in the same MongoDB document, excluded from
default queries. Photos can be viewed only through the owner-protected endpoint. The 15 MiB
combined photo cap leaves room under MongoDB's 16 MiB document limit. Nginx accepts
bodies up to 16 MiB; rebuild the frontend Docker image to apply this setting.
HTTP tests mock database writes and do not create real help requests.

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
