# Profile links and link previews

Clicking Share publishes a snapshot of the account's display name, profile photo, and user-written About me bio. It returns a stable random UUID link: `/profile/:token`. Email, IDs, stories, conversations, social-link evidence, and AI-generated summaries are not included. Profiles are unlisted (`noindex,nofollow`), but anyone with the link can read the published fields. Later Share clicks refresh that snapshot.

- `POST /users/profile/share` requires authentication, accepts no client profile data, and returns `{token}`.
- `DELETE /users/profile/share` requires authentication and revokes the current link. A subsequent Share creates a new token.
- `GET /public/profiles/:token` is a public HTML page. Deleted accounts and revoked/missing links are unavailable. It includes OG and Twitter metadata before JavaScript, uses escaped content, and sends a CSP with a hash for its static style block.
- `public/og/profile.png` is the 1200×630 PNG used in previews; its editable source is alongside it.

## Deployment

Both the API and web app need this change. API `FRONTEND_URL` must be the public web origin, and `BACKEND_URL` must resolve profile images. The Vercel function uses the existing server-side `VITE_API_BASE_URL` environment variable. `vercel.json` sends `/profile/:token` to the function ahead of the SPA fallback. The function proxies public HTML without forwarding browser cookies or authorization headers. Missing configuration or upstream failures return an error instead of a broken app-shell preview.

For localhost, the Vite proxy sends `/profile/*` to the API configured by `VITE_API_BASE_URL`. It also strips cookies and authorization. The API must be running, and its configured `FRONTEND_URL` controls canonical metadata. External platforms cannot crawl localhost; live preview validation requires a deployed HTTPS URL. Platforms may cache previous previews and control whether they display a card.
