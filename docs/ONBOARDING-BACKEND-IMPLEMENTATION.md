# Onboarding Backend Implementation Guide

**Last updated:** March 2025  
**Status:** Frontend complete; backend not implemented. Onboarding flow works locally but does not persist data to the backend.

---

## Executive Summary

The Memento web app has a working onboarding flow that collects rich user profile data (identity, motivations, priorities, expression preferences). The flow runs end-to-end in the browser and persists progress to **localStorage only**. No onboarding data is stored on the backend because the required APIs do not exist yet.

**What works today:**
- Full 8-step Groot onboarding flow (`/onboarding`)
- Legacy 7-step onboard flow (`/onboard/misc`)
- Step validation, adaptive copy, CTA actions
- localStorage persistence and skip/complete state
- Redirect logic (OnboardingGuard) with localStorage fallback

**What does not work:**
- `POST /host/onboarding` — returns 404; frontend catches error and continues
- `PATCH /host/onboarding/progress` — not implemented; frontend never calls it (but API client exists)
- `GET /host/profile` — returns 404; revisit mode cannot pre-populate
- User profile does not include `onboarding_complete`, `onboarding_skipped`, `onboarding_step_reached`

---

## Two Onboarding Flows

### 1. Legacy flow (`/onboard`)

**Path:** `/onboard` → `/onboard/welcome` → `/onboard/nickname` → `/onboard/misc` → `/onboard/beneficiary`

- **Entry:** OnboardingGuard redirects new users to `/onboard`
- **Data source:** `useOnboardQuestionsState` (7 steps, different step order)
- **On completion:** Calls both:
  - `saveOnboarding()` → `POST /host/onboarding` (Groot payload) — **404**
  - `completeOnboarding()` → `POST /users/complete-onboarding` (legacy payload) — **may exist**
- **Legacy payload** (`/users/complete-onboarding`): `{ dob, join_reasons, self_description, current_priority }`

### 2. Groot flow (`/onboarding`)

**Path:** `/onboarding` (8 steps in one page)

- **Entry:** Direct navigation or Settings "Revisit preferences" (`/onboarding?mode=revisit`)
- **Data source:** `useOnboardingState` (8 steps)
- **On completion:** Calls only `saveOnboarding()` → `POST /host/onboarding` — **404**
- **Does not call** `completeOnboarding` or `saveOnboardingProgress`

---

## Data Collected (Full Schema)

### SaveOnboardingBody (POST /host/onboarding)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | yes | User's full name |
| `displayName` | string | yes | Nickname / what to call user in UI |
| `ageBand` | string | yes | `under_30` \| `30s_40s` \| `50s_60s` \| `70_plus` \| `prefer_not_say` |
| `whereFrom` | string | no | Free text: "Where are you from?" |
| `mementoFor` | string[] | yes | Who is this for: `children`, `grandchildren`, `partner_spouse`, `close_friends`, `future_generations`, `myself`, `something_else` |
| `mementoForFreetext` | string | no | When `something_else` selected |
| `passions` | string[] | yes | e.g. `food_cooking`, `travel_places`, `faith_spirituality`, `music`, etc. |
| `passionsFreetext` | string | no | When `something_else` selected |
| `lifeContext` | string[] | yes | e.g. `still_working`, `retired_slowing_down`, `recent_loss`, `health_change`, etc. |
| `motivationType` | string | yes | `emotional_depth` \| `memory_preservation` \| `external` \| `practical` \| `explorer` \| `all` |
| `priorityDimensions` | string[] | yes | e.g. `people_relationships`, `memories_stories`, `beliefs_values`, etc. |
| `dimensionsFreetext` | string | no | When `something_else` selected |
| `expressionMode` | string[] | yes | `voice` \| `writing` \| `media` \| `guided` |
| `isComplete` | boolean | yes | Always `true` when saving on completion |
| `stepReached` | number | yes | Final step (7 or 8) |

### SaveProgressBody (PATCH /host/onboarding/progress)

Partial updates as user advances. Same fields as above, but all optional except `stepReached`.

---

## Required Backend APIs

### 1. POST /host/onboarding

**Purpose:** Save full onboarding data when user completes the flow.

**Request:**
- Method: `POST`
- Path: `/host/onboarding` (or `/api/host/onboarding` depending on your base path)
- Headers: `Authorization: Bearer <token>`
- Body: `SaveOnboardingBody` (see above)

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "enrichmentScoreSeed": {
      "people_relationships": 1.2,
      "memories_stories": 0.8,
      "beliefs_values": 1.0
    }
  }
}
```

**Backend actions:**
1. Validate JWT, get user ID
2. Upsert onboarding record (or user profile fields)
3. Set `onboarding_complete = true`, `onboarding_step_reached = stepReached`
4. Optionally compute `enrichmentScoreSeed` from `priorityDimensions`: selected → 1.2, unselected → 0.8, baseline → 1.0
5. Return success

---

### 2. PATCH /host/onboarding/progress

**Purpose:** Save incremental progress as user advances steps (resume support, analytics).

**Request:**
- Method: `PATCH`
- Path: `/host/onboarding/progress`
- Headers: `Authorization: Bearer <token>`
- Body: `SaveProgressBody` (partial; at minimum `{ stepReached: number }`)

**Response:**
```json
{
  "success": true,
  "data": { "success": true }
}
```

**Note:** The frontend currently does **not** call this endpoint. You can either:
- Implement it for future use (e.g. when frontend adds progress saving), or
- Add a frontend change to call `saveOnboardingProgress` on each `advanceStep`

---

### 3. GET /host/profile

**Purpose:** Fetch onboarding data for "Revisit preferences" mode (`/onboarding?mode=revisit`).

**Request:**
- Method: `GET`
- Path: `/host/profile`
- Headers: `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "fullName": "Jane Doe",
    "displayName": "Jane",
    "ageBand": "30s_40s",
    "whereFrom": "London",
    "mementoFor": ["children", "partner_spouse"],
    "mementoForFreetext": null,
    "passions": ["reading_learning", "nature_outdoors"],
    "passionsFreetext": null,
    "lifeContext": ["still_working"],
    "motivationType": "emotional_depth",
    "priorityDimensions": ["people_relationships", "memories_stories"],
    "dimensionsFreetext": null,
    "expressionMode": ["voice", "writing"]
  }
}
```

**Alternative:** Extend existing `GET /users/profile` to include these fields instead of a separate endpoint.

---

### 4. User profile extensions

The user profile (from `GET /users/profile`) must include:

| Field | Type | Description |
|-------|------|-------------|
| `onboarding_complete` | boolean | `true` when user has completed onboarding |
| `onboarding_skipped` | boolean | `true` when user clicked "Skip for now" |
| `onboarding_step_reached` | number | Last step reached (1–8) |

These drive OnboardingGuard redirect logic and the dashboard nudge banner.

---

## Database Schema Suggestion

```sql
-- Option A: Separate onboarding table
CREATE TABLE host_onboarding (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  full_name TEXT,
  display_name TEXT,
  age_band TEXT,
  where_from TEXT,
  memento_for TEXT[],
  memento_for_freetext TEXT,
  passions TEXT[],
  passions_freetext TEXT,
  life_context TEXT[],
  motivation_type TEXT,
  priority_dimensions TEXT[],
  dimensions_freetext TEXT,
  expression_mode TEXT[],
  is_complete BOOLEAN DEFAULT false,
  step_reached INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Option B: Add columns to users table
ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN onboarding_skipped BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN onboarding_step_reached INT DEFAULT 0;
-- Plus JSONB or separate table for full onboarding payload
```

---

## Frontend Integration Points

When backend is ready:

1. **No frontend changes required** for `POST /host/onboarding` — it is already called; it will start succeeding.
2. **Optional:** Wire `saveOnboardingProgress` in `useOnboardingState.advanceStep` and in `OnboardingGrootPage.handleAdvance` to call the progress endpoint on each step.
3. **Revisit mode:** In `OnboardingGrootPage`, when `?mode=revisit`, call `fetchHostProfile()` and pass result as `initialState` to `useOnboardingState`.
4. **OnboardingGuard:** Already checks `user?.onboarding_complete`; ensure profile API returns it.

---

## API Base URL

Frontend uses `import.meta.env.VITE_API_BASE_URL`. Endpoints are relative to that (e.g. `https://api.example.com/host/onboarding`).

---

# AI Agent Prompt: Backend Implementation

Use the following prompt with your AI coding agent to implement the backend support.

---

## Prompt for AI Agent

```
You are implementing backend support for the Memento onboarding flow. The frontend is complete and calls these endpoints; they currently return 404.

## Context

- Framework: [Your backend framework - e.g. Express, Fastify, NestJS]
- Database: [Your DB - e.g. PostgreSQL, MongoDB]
- Auth: JWT in Authorization header

## Tasks

### 1. Implement POST /host/onboarding

- Path: /host/onboarding (or /api/host/onboarding)
- Method: POST
- Auth: Required (Bearer token)
- Request body schema (all fields from frontend SaveOnboardingBody):
  - fullName: string (required)
  - displayName: string (required)
  - ageBand: string (required) - enum: under_30, 30s_40s, 50s_60s, 70_plus, prefer_not_say
  - whereFrom?: string
  - mementoFor: string[] (required)
  - mementoForFreetext?: string
  - passions: string[] (required)
  - passionsFreetext?: string
  - lifeContext: string[] (required)
  - motivationType: string (required) - enum: emotional_depth, memory_preservation, external, practical, explorer, all
  - priorityDimensions: string[] (required)
  - dimensionsFreetext?: string
  - expressionMode: string[] (required) - enum: voice, writing, media, guided
  - isComplete: boolean (required)
  - stepReached: number (required)

- Actions:
  1. Validate JWT, extract user ID
  2. Validate request body
  3. Upsert onboarding record for this user (create or update)
  4. Set user.onboarding_complete = true, user.onboarding_step_reached = body.stepReached
  5. Optionally compute enrichmentScoreSeed: for each DimensionKey (people_relationships, memories_stories, beliefs_values, heritage_roots, passions_interests, work_purpose, wishes_letters, everyday_life, hardships_resilience, humour_personality, something_else), if in priorityDimensions use 1.2, else 0.8
  6. Return { success: true, data: { success: true, enrichmentScoreSeed?: Record<string, number> } }

### 2. Implement PATCH /host/onboarding/progress

- Path: /host/onboarding/progress
- Method: PATCH
- Auth: Required
- Request body: partial SaveProgressBody - stepReached (required), plus any optional fields from SaveOnboardingBody
- Actions: Update onboarding record with provided fields; update user.onboarding_step_reached
- Return { success: true, data: { success: true } }

### 3. Implement GET /host/profile

- Path: /host/profile
- Method: GET
- Auth: Required
- Actions: Fetch onboarding record for user, return as JSON
- Return { success: true, data: { fullName, displayName, ageBand, whereFrom, mementoFor, ... } }
- If no record exists, return { success: true, data: {} }

### 4. Extend user profile

Ensure GET /users/profile (or equivalent) returns:
- onboarding_complete: boolean
- onboarding_skipped: boolean  
- onboarding_step_reached: number

These may come from the users table or a join with host_onboarding.

### 5. Database

Create a host_onboarding table (or equivalent) with columns for all SaveOnboardingBody fields, plus user_id (FK to users), created_at, updated_at. Use UNIQUE constraint on user_id for upsert behavior.

### 6. Handle skip

When user skips onboarding, frontend sets localStorage. Backend should support PATCH /host/onboarding/progress with a flag or a separate endpoint to set onboarding_skipped = true. Alternatively, the frontend may need a new endpoint for skip - check if one exists.

## Reference

- Frontend API client: src/api/onboarding.ts
- Types: src/features/onboarding-groot/types.ts
- Full option enums in types.ts: AGE_BAND_OPTIONS, MEMENTO_FOR_OPTIONS, PASSION_OPTIONS, LIFE_CONTEXT_OPTIONS, MOTIVATION_OPTIONS, DIMENSION_OPTIONS, EXPRESSION_OPTIONS
```

---

## Summary Checklist for Dev

- [ ] Create `host_onboarding` table (or add columns to users)
- [ ] Implement `POST /host/onboarding`
- [ ] Implement `PATCH /host/onboarding/progress`
- [ ] Implement `GET /host/profile` (or extend `/users/profile`)
- [ ] Add `onboarding_complete`, `onboarding_skipped`, `onboarding_step_reached` to user profile response
- [ ] Add skip endpoint or handle skip via progress endpoint
- [ ] Test with frontend; verify no 404s and data persists
