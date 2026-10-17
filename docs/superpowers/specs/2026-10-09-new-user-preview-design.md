# Local new-user preview

The existing DEV-only toggle removes all SWR data, including profile and starter content. It must instead represent a signed-in user after onboarding, with no personal stories, conversations, capsules, people, or insights. The user approved starter content remaining available, temporary local actions, and restarting from a fresh state on every activation. Real Chat saves are permitted if needed, but the chosen implementation keeps text Chat local as well.

Use a DEV-only in-memory session at the API boundary. Mock personal reads with valid response shapes, starter prompts with unanswered examples, and supported writes with local records. Preserve authentication, available features, subscription access, and basic profile identity. Block unsupported writes with an explicit preview error rather than send them to the account. Live AI voice is outside the local simulation; its service requests must be blocked explicitly.

Give the mounted preview its own SWR cache and profile context. Remount the application content when entering/leaving preview so existing messages and component state do not survive. Redirect existing host Chat routes to `/chat/new` on entry; restore their original route on exit when still in Chat. Preview drafts and enrichment bookkeeping use temporary storage. Switching off restores the real store and cache; switching on creates a new session.

The toolbar names this mode New user preview, states that actions are local, and exposes a semantic switch and the existing Ctrl+Shift+E shortcut. Motion stays scoped to the toolbar and respects reduced motion.

Verification covers valid empty collections, retained starter content, profile isolation, local saves and Chat replies, blocked unknown writes, streamed replies, storage isolation, repeated activation, existing-route redirection, normal-cache restoration, local browser flows, and production exclusion of the DEV modules.
