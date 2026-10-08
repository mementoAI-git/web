# Confirmed social profiles implementation plan

Implement the user's requested five MingCute platform icons and confirmed account links.

1. Download the official MingCute brand SVGs with license attribution.
2. Extend the authenticated persona contract with per-platform social accounts. Validate HTTPS platform profile URLs; record manual versus AI provenance. Null marks an explicitly removed account.
3. Add profile editing for all five URLs and show only present, valid accounts in the header.
4. Extend the existing story/conversation insight worker with grounded ownership extraction. Require explicit first-person ownership and exact evidence from user-authored content, never assistant output or name similarity. Do not overwrite existing links or removal markers.
5. Cover validators, conditional rendering, manual editing, ownership evidence, worker writes and conflicts with tests. Run backend compile and frontend build/lint, and inspect desktop/mobile layouts.

An authenticated profile read schedules a deduplicated one-time background scan of the owner’s existing bio, messages, saved stories and transcripts. New content is handled by the existing insight jobs. No deployment is included.
