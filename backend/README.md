# Backend API

## Registration

`POST /api/auth/register` accepts JSON:

```json
{
  "name": "Example Volunteer",
  "email": "volunteer@example.com",
  "password": "use a long unique passphrase",
  "role": "volunteer",
  "preferredLanguage": "en"
}
```

- Public roles: `volunteer`, `help_seeker`, `funder`. Admin is not a public role.
- Passwords: 15–128 characters; spaces and Unicode are allowed. Passwords are
  hashed with salted scrypt and are never returned or logged.
- Language: optional `en` (default) or `si`.
- Extra fields are rejected. Emails are trimmed, lowercased, and uniquely indexed.
- Responses: `201` created, `400` invalid input, `409` email already registered,
  `413` body too large, `429` registration rate limit, `500` internal error.
- Limit: 10 registration attempts per IP per 15 minutes, in memory for the current
  single-process deployment. A shared limiter store and trusted-proxy configuration
  are required before scaling to multiple backend instances.

Successful registration returns an allowlisted user object. It does not sign the
user in. Login, email verification, and the registration form are subsequent steps.
Use HTTPS when deploying. Do not publish private user details in the homepage feed.

Run `npm test` from `backend/`. The API tests exercise HTTP with mocked database
writes; they do not persist users. The unique-index guarantee requires MongoDB;
the server waits for the user index to initialize before listening.
