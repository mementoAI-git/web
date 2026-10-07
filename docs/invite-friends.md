# Invite friends

The sidebar opens a shadcn Dialog with a personal invite link, Copy action, and the number of unique accounts created through that link. There are no rewards, credits, targets, or progress bars.

## Contract

Authenticated `GET /users/referrals` returns:

```json
{"success":true,"data":{"invite_url":"https://mymemento.io/register?ref=<32-character-code>","signup_count":0}}
```

The API generates and persists the code atomically when an account first requests its link, including existing accounts. It returns only the count, never invitees' identities. The link origin comes from the API's `FRONTEND_URL`.

Email registration and OAuth accept an optional `referral_code`. It is validated, resolved to an active inviter, and recorded only when a new account is created. Existing account sign-ins never add to the count. Invalid or unknown links cannot write arbitrary attribution. Counts include historical created accounts, including accounts that are not yet email-verified or have since been soft-deleted.

The web app keeps the first valid code locally for up to 30 days so it survives navigation and OAuth redirects. It clears the code after successful signup/authentication. Storage or clipboard failures do not block registration or manual copying.

## Release

The development API and web deploy together. The API release migration `202610070001_personal_referral_links` creates the unique sparse invite-code index and the inviter lookup index automatically before the release is activated. No user-data backfill is needed. The indexes have also been applied to the configured development database.

For a local API, set `VITE_API_BASE_URL=http://localhost:5002` in the web app’s ignored `.env.local` and `FRONTEND_URL=http://localhost:5173` in the API environment. The local API exposes routes at the root; deployed nginx serves them under `/api`.

## Validation

Web referral tests cover capture/expiry, registration payload, sidebar action, real count rendering, API failure/retry, copying/manual fallback, and Escape/focus restoration. `npm run test:referrals` in the API covers stable codes, concurrent creation, counts, unknown codes and boundary validation. API integration tests use an isolated in-memory MongoDB, mock outgoing mail and OAuth provider responses, and cover real email/OAuth signup counts, stable concurrent links, duplicate signup rejection, existing-account attribution, and authentication. OAuth web callback tests ensure StrictMode does not exchange the same authorization code twice.
