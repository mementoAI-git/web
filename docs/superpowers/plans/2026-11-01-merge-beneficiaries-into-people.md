# Merge beneficiary management into People

Authorized direction: People replaces the web beneficiary management surface; reuse mobile’s more recent edit fields and dedicated removal confirmation. Layout polishing is deferred. Native mobile stays unchanged.

- Existing `/settings/beneficiary` links redirect to the personal Chat route with People open. Settings calls the destination People & Groups.
- Accepted connection settings support saved photo, display name, relationship, private description, groups, and the existing access scopes. Email is read-only. New web invites, including onboarding, use shared_only. Existing scopes are sent only when explicitly edited.
- Extend People settings additively. Updates reuse the current viewer-owned beneficiary ID, preserve legacy groups/shares, and never edit the other user profile or AI context. For an incoming-only connection, create a shared-only reciprocal recipient only when additional metadata needs storage. Validate ownership of group IDs and uploaded photos server-side.
- Removal uses one dedicated confirmation and the existing pair-wide People revocation, cleans group membership, hides removed recipients from legacy lists, and reconciles usage. Reinvites reuse the recipient ID and reacquire the released slot.
- Keep invitation limits and feature gates at the consolidated entry point. Reuse existing pending invite and group modals.

Verification: targeted API settings/invitation/accounting tests, frontend edit/removal/switcher/settings/onboarding tests, API compile, web build, scoped lint, and running-app interaction checks with isolated browser fixtures. No real invites or live account mutations were sent.
