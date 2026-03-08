# Security Rules

This repository handles production user data. Treat security requirements as **non-optional**.

## Agent Rules (MUST FOLLOW)

- **No secrets in code**
  - Never commit API keys, tokens, JWTs, database passwords, or signing secrets.
  - Client-side env vars must use the framework's public prefix (`NEXT_PUBLIC_*`, `VITE_*`, `EXPO_PUBLIC_*`, etc.) and must be non-sensitive.
  - Server-only secrets belong exclusively in server-side env configuration — never bundle them into client code.

- **Assume public keys are public**
  - Anyone can extract client-side keys from a web or mobile app.
  - All data protection must be enforced via server-side auth, authorization checks, and access control — never rely on client-side secrecy.

- **Service / privileged keys**
  - Service-role or admin keys may only be used in:
    - Server-side route handlers or API routes
    - Edge Functions or serverless functions
    - Trusted backend workers
  - Never expose service-role or admin keys to the browser or client bundle.

- **Authorization is server-side**
  - All write operations and sensitive reads must be authorized on the server.
  - Client components must not call privileged APIs directly — route through authenticated server endpoints.
  - If using a BaaS (Supabase, Firebase, etc.), enforce row-level security or security rules — never rely solely on client queries.

- **Input validation**
  - Validate and sanitize all user input on the server before processing or storing.
  - Use schema validation (e.g. `zod`, `yup`, `joi`) at API boundaries.
  - Apply rate limiting to public-facing endpoints.

- **Do not increase attack surface**
  - Do not attach privileged objects to `window` or global scope unless strictly required.
  - Avoid broad CORS (`*`) except where explicitly intended and reviewed.
  - Do not disable security headers, CSRF protection, or auth middleware without explicit approval.

## Required Checks Before Merge

- **Repository scan**
  - Search for leaked keys:
    - API keys and service-role keys
    - JWTs (`eyJ...`)
    - Any secret keys or tokens
    - Database connection strings

- **Dependency review**
  - Flag new dependencies that request broad permissions or have known vulnerabilities.
  - Prefer well-maintained, widely-used packages.

- **Verify public write paths**
  - Confirm no public endpoints allow unvalidated writes.
  - Confirm any public write action is routed through a validated, rate-limited server endpoint.

## Patterns To Use

- **Server-side mutations**
  - All data mutations (create, update, delete) must go through authenticated server endpoints.
  - Client code should call API routes, not write to databases directly.

- **Authentication flow**
  - Store tokens securely (httpOnly cookies preferred over localStorage for web).
  - Implement proper token refresh and expiry handling.
  - Clear auth state completely on logout.

- **API client hardening**
  - Attach auth headers via interceptors, not manually per-request.
  - Handle 401/403 responses globally (redirect to login, refresh token, etc.).
  - Do not log or expose tokens in error messages or console output.

## Incident Response (If a key is exposed)

- Rotate impacted keys immediately.
- Audit access logs for unusual activity.
- Review authorization policies and access grants.
- Add a regression test or checklist entry to prevent recurrence.
