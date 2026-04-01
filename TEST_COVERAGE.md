# Test Coverage Tracker

Track what has been tested. Updated each time a feature is built or tests are added.

**Test runner:** Vitest | **Command:** `npm test` | **Watch mode:** `npm run test:watch`

---

## Tested Files

### Utilities

| Source File | Test File | Tests | Type |
|---|---|---|---|
| `src/utility/index.ts` | `src/utility/index.test.ts` | 53 | Unit |
| `src/utility/auth-service.ts` | `src/utility/auth-service.test.ts` | 14 | Unit |
| `src/utility/memory.ts` | `src/utility/memory.test.ts` | 6 | Unit |
| `src/lib/utils.ts` | (covered via `src/utility/index.test.ts`) | — | Unit |
| `src/pages/.../utility/ColorContrast.ts` | `src/pages/.../utility/ColorContrast.test.ts` | 8 | Unit |
| `src/pages/.../utility/helpers.ts` | `src/pages/.../utility/helpers.test.ts` | 18 | Unit |

### Hooks

| Source File | Test File | Tests | Type |
|---|---|---|---|
| `src/hooks/use-store.tsx` | `src/hooks/use-store.test.tsx` | 5 | Unit |
| `src/hooks/use-modal.tsx` | `src/hooks/use-modal.test.tsx` | 6 | Unit |

### Components

| Source File | Test File | Tests | Type |
|---|---|---|---|
| `src/components/ui/button.tsx` | `src/components/ui/button.test.tsx` | 6 | Unit |
| `src/components/switch.tsx` | `src/components/switch.test.tsx` | 4 | Unit |
| `src/components/spinner.tsx` | `src/components/spinner.test.tsx` | 3 | Unit |
| `src/components/Form/text-input.tsx` | `src/components/Form/text-input.test.tsx` | 4 | Unit |
| `src/components/Form/password-input.tsx` | `src/components/Form/password-input.test.tsx` | 1 | Unit |
| `src/components/Form/search-input.tsx` | `src/components/Form/search-input.test.tsx` | 3 | Unit |
| `src/components/Form/checkbox.tsx` | `src/components/Form/checkbox.test.tsx` | 2 | Unit |

### Pages (Integration)

| Source File | Test File | Tests | Type |
|---|---|---|---|
| `src/pages/dashboard/chat/main/index.tsx` | `src/pages/.../chat-landing.test.tsx` | 6 | Integration |

---

## Summary

| Category | Files Tested | Total Tests |
|---|---|---|
| Utilities | 5 | 99 |
| Hooks | 2 | 11 |
| Components | 7 | 23 |
| Pages | 1 | 6 |
| **Total (listed rows)** | **15** | **139** |

*Full Vitest unit project includes additional files not listed in this table; run `npm test` for the current count.*

---

## Not Yet Tested

### High Priority
- `src/api/fetcher.ts` — API fetcher with interceptors, token refresh, error handling
- `src/api/client.ts` — Alternate API client
- `src/hooks/use-form.ts` — Form validation with Yup
- `src/hooks/use-copy.ts` — Clipboard copy hook
- `src/hooks/use-bookmark.ts` — Bookmark toggle with API calls
- `src/hooks/use-clickaway.ts` — Click outside detection
- `src/hooks/use-chat.tsx` — Chat context provider
- `src/components/Form/select-input.tsx`, `tag-input.tsx`, `dateinput.tsx` — not yet covered by dedicated unit tests
- `src/components/Dropdown/*` — Dropdown menu system
- `src/pages/auth/login/index.tsx` — Login page with form + API
- `src/pages/auth/register/index.tsx` — Registration page

### Medium Priority
- `src/components/layouts/auth-check.tsx` — Auth guard
- `src/components/modal/*` — Modal system (settings, memory, capsule, etc.)
- `src/components/memory/*` — Memory editor components
- `src/components/Chatinput/*` — Chat input with voice
- `src/components/conversation-bar.tsx` — Conversation list item
- `src/components/strength-indicator.tsx` — Password strength UI
- `src/pages/dashboard/overview/*` — Dashboard overview sections
- `src/pages/dashboard/stories/*` — Stories pages
- `src/pages/dashboard/explore/*` — Explore pages

### Lower Priority
- `src/components/icons/*` — Icon components (pure SVG, low risk)
- `src/components/player/*` — Audio/video players
- `src/components/recorder/*` — Audio/video recorders
- `src/pages/onboard/*` — Onboarding flow
- `src/pages/dashboard/time-capsule-new/*` — Time capsule pages
