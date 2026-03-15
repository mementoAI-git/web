# Memento — Host Onboarding PRD
**Version:** 1.0  
**Feature:** Multi-step personalised onboarding for host users  
**Target builder:** Cursor / Windsurf (in-codebase AI)  
**Stack assumption:** React + TypeScript. Adapt component patterns to match existing codebase conventions.

---

## 1. Purpose

Build a 5-step onboarding flow that runs the first time a host user logs in to Memento. The flow collects identity, motivation, content preferences, and life dimension priorities. This data personalises the dashboard and seeds the Enrichment Score before any content has been uploaded.

The flow must feel warm and conversational — never like a form. Almost every question is answered by selecting cards. Free text is always optional except for the host's display name.

---

## 2. Scope

**In scope:**
- 5-step onboarding flow (full implementation)
- Progress persistence (resume from last step on re-entry)
- Skip behaviour + dashboard nudge
- Adaptive logic for Steps 4 and 5
- Data write to host record on completion
- "Revisit preferences" re-onboarding trigger from Settings

**Out of scope:**
- Dashboard personalisation rendering (consuming the onboarding data)
- Enrichment Score calculation engine (onboarding only writes the seed)
- Beneficiary onboarding

---

## 3. Routing & Entry Points

| Condition | Behaviour |
|---|---|
| New host, first login | Redirect to `/onboarding` before dashboard |
| `onboarding_complete: false` on any login | Show dashboard nudge banner (see §9) |
| `onboarding_step_reached: N` and incomplete | Resume at step N on `/onboarding` load |
| Host clicks "Revisit preferences" in Settings | Navigate to `/onboarding?mode=revisit` — pre-populate all fields |
| Host clicks "Skip for now" | Redirect to `/dashboard`, set `onboarding_skipped: true` |

---

## 4. State Management

Maintain a single `onboardingState` object in component state (or a dedicated store slice). Persist to `localStorage` on every step advance so progress survives page refreshes and accidental closes.

```typescript
interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  displayName: string;
  hostArchetype: 'family' | 'life_lived' | 'planning' | 'young' | 'other' | null;
  hostArchetypeFreetext: string;
  motivationType: 'emotional_depth' | 'memory_preservation' | 'external' | 'practical' | 'explorer' | null;
  priorityDimensions: DimensionKey[];
  expressionMode: ExpressionMode[];
  isComplete: boolean;
  isRevisitMode: boolean;
}

type DimensionKey =
  | 'people_relationships'
  | 'memories_stories'
  | 'beliefs_values'
  | 'heritage_roots'
  | 'passions_interests'
  | 'work_purpose'
  | 'wishes_letters'
  | 'everyday_life'
  | 'hardships_resilience'
  | 'humour_personality';

type ExpressionMode = 'voice' | 'writing' | 'media' | 'guided';
```

**Persistence rules:**
- Write to `localStorage` key `memento_onboarding_state` on every `currentStep` increment.
- On `/onboarding` mount, read from `localStorage` first. If present and `isComplete: false`, restore state and jump to `currentStep`.
- On completion, clear `localStorage` entry and write final data to backend (see §10).
- In revisit mode (`?mode=revisit`), pre-populate state from the host's existing record but set `isComplete: false` to allow re-saving.

---

## 5. Layout & Shell

The onboarding shell wraps all 5 steps. It never changes between steps — only the inner content transitions.

```
┌─────────────────────────────────────────┐
│  [Logo]              [Skip for now →]   │  ← Topbar. Fixed.
├─────────────────────────────────────────┤
│                                         │
│         ● ● ○ ○ ○   ← Step dots        │
│         "Getting to know you"           │  ← Step label
│                                         │
│   ┌─────────────────────────────────┐   │
│   │                                 │   │
│   │         Step content            │   │  ← Max-width 560px, centred
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [← Back]           [Continue →]      │  ← Fixed footer nav
└─────────────────────────────────────────┘
```

**Shell component props:**
```typescript
interface OnboardingShellProps {
  currentStep: number;
  totalSteps: number;       // always 5
  stepLabel: string;
  canAdvance: boolean;      // controls whether Continue is enabled
  onAdvance: () => void;
  onBack: () => void;
  onSkip: () => void;
  advanceLabel?: string;    // defaults to "Continue →"
  showBack?: boolean;       // false on step 1
}
```

**Step labels by step:**
```
1 → "Let's get started"
2 → "Getting to know you"
3 → "Almost halfway"
4 → "Nearly there"
5 → "You're all set"
```

**Step dots:**
- Filled amber circle (`#C8956C`) = completed step
- Amber outlined circle = current step
- Empty grey circle (`#E4D9CC`) = future step
- Dots are not clickable (no jumping between steps)

**Forward button labels by step:**
```
Steps 1–3 → "Continue →"
Step 4    → "Almost there →"
Step 5    → "Let's begin →"   (or "Save changes →" in revisit mode)
```

**Back button:**
- Text-only, muted colour (`#B0A098`), no icon
- Hidden on Step 1
- On Step 2–5: goes to previous step, restores previous answers

**Skip link:**
- Top-right, small, muted text
- Label: `Skip for now →`
- Triggers skip behaviour (see §3)
- Hidden on Step 5 (no need to skip the final CTA)

---

## 6. Step Specifications

---

### Step 1 — Who Are You?

**`canAdvance`:** true when `displayName` is non-empty (trimmed). `hostArchetype` selection is required before continuing — if not selected, show inline validation: *"Please pick the option that fits best."*

**Components:**

**1a — Name input**
```
Label:       "Your name"
Input type:  text
Placeholder: "Eleanor, Jamie, Nne, Dad..."
Validation:  Required. Min 1 character (trimmed). Max 40 characters.
Error state: Border turns amber, message below: "We'd love to know what to call you."
Behaviour:   On focus, border becomes amber. On blur with value, border becomes green-soft.
```

**1b — Archetype selector**
```
Type:        Single-select card grid
Columns:     2 on desktop, 1 on mobile
Selection:   Required before advancing
```

Cards:
```typescript
const ARCHETYPE_OPTIONS = [
  {
    value: 'family',
    label: "I'm preserving memories for my family",
    sublabel: "Stories, photos, and things they should know",
    icon: "🌿"
  },
  {
    value: 'life_lived',
    label: "I'm reflecting on a life well-lived",
    sublabel: "A rich journey worth remembering",
    icon: "📖"
  },
  {
    value: 'planning',
    label: "I'm planning thoughtfully for the future",
    sublabel: "Organised, intentional, ahead of time",
    icon: "🕊️"
  },
  {
    value: 'young',
    label: "I'm young and thinking ahead",
    sublabel: "Because now is as good a time as any",
    icon: "✨"
  },
  {
    value: 'other',
    label: "Something else",
    sublabel: "I'll describe it in my own words (optional)",
    icon: "💬"
  }
];
```

**Conditional — "other" free text:**
- When `hostArchetype === 'other'`, reveal a textarea below the cards with a smooth expand animation (max-height transition, 200ms ease).
- Label: `Tell us a little about why you're here`
- Placeholder: `No pressure — whatever feels right`
- Character limit: 280
- This field is optional. `canAdvance` is not blocked by it.

---

### Step 2 — Why Are You Here?

**`canAdvance`:** true when `motivationType` is non-null.

**Component:** Single-select card list (full-width cards, stacked vertically — not a grid).

```typescript
const MOTIVATION_OPTIONS = [
  {
    value: 'emotional_depth',
    label: "I want the people I love to truly know me",
    sublabel: "The full picture, not just the highlights",
    icon: "💛"
  },
  {
    value: 'memory_preservation',
    label: "I have memories I'm afraid of losing",
    sublabel: "Before they fade or disappear",
    icon: "🫙"
  },
  {
    value: 'external',
    label: "Someone I love asked me to do this",
    sublabel: "I'm here because they asked",
    icon: "🤍"
  },
  {
    value: 'practical',
    label: "I'm being practical about the future",
    sublabel: "Getting important things in order",
    icon: "🗂️"
  },
  {
    value: 'explorer',
    label: "I just want to see what this is",
    sublabel: "Exploring for now",
    icon: "🔍"
  }
];
```

---

### Step 3 — What Matters Most?

**`canAdvance`:** true when `priorityDimensions.length >= 1`. If zero selected and user tries to advance, show inline message below the grid: *"Even just one is a great place to start."*

**Component:** Multi-select card grid. No maximum. 2 columns desktop, 1 mobile.

```typescript
const DIMENSION_OPTIONS: { value: DimensionKey; label: string; sublabel: string; icon: string }[] = [
  { value: 'people_relationships', label: "Family & relationships",    sublabel: "The people who shaped you",              icon: "🤝" },
  { value: 'memories_stories',     label: "Stories & adventures",      sublabel: "Things that happened, places you went",  icon: "📚" },
  { value: 'beliefs_values',       label: "Beliefs & values",          sublabel: "What you stand for and live by",         icon: "🕯️" },
  { value: 'heritage_roots',       label: "Places that shaped you",    sublabel: "Where you're from, where you've been",   icon: "🗺️" },
  { value: 'passions_interests',   label: "Passions & interests",      sublabel: "What you love to do or think about",     icon: "🌟" },
  { value: 'work_purpose',         label: "Work & what you built",     sublabel: "Your career, craft, or contribution",    icon: "🔨" },
  { value: 'wishes_letters',       label: "Letters & things unsaid",   sublabel: "Words for specific people or moments",   icon: "💌" },
  { value: 'everyday_life',        label: "Everyday life",             sublabel: "The small things that made up your days",icon: "☕" },
  { value: 'hardships_resilience', label: "Hardships & resilience",    sublabel: "What you survived and what it taught you",icon: "🌊" },
  { value: 'humour_personality',   label: "Humour & personality",      sublabel: "How you laugh, what makes you you",      icon: "😄" },
];
```

Selected state: amber border (`1.5px solid #C8956C`) + amber-pale background (`#F5E6DA`) + checkmark badge (top-right corner of card, small amber circle with white tick).

---

### Step 4 — How Do You Like to Share?

**`canAdvance`:** true when `expressionMode.length >= 1`. Max 2 selections. If user tries to select a 3rd, do not add it — optionally show a brief tooltip: *"Pick your top two."*

**Headline:** Adaptive based on `motivationType`:

```typescript
const getStep4Headline = (motivation: MotivationType): string => {
  switch (motivation) {
    case 'emotional_depth':
    case 'external':
      return "How do you most naturally open up?";
    case 'memory_preservation':
    case 'practical':
      return "How would you most like to add to your Memento?";
    case 'explorer':
    default:
      return "What feels most like you?";
  }
};
```

**Subtext (static):** `We'll make sure that's the easiest way to get started.`

**Component:** Multi-select card grid (2 columns desktop, 1 mobile). Max 2 selections.

```typescript
const EXPRESSION_OPTIONS = [
  {
    value: 'voice',
    label: "Talking — I prefer to speak",
    sublabel: "Recording a voice note feels natural to me",
    icon: "🎙️"
  },
  {
    value: 'writing',
    label: "Writing — I like taking my time",
    sublabel: "I'd rather compose my thoughts in words",
    icon: "✍️"
  },
  {
    value: 'media',
    label: "Photos & videos",
    sublabel: "Showing is easier than telling",
    icon: "📷"
  },
  {
    value: 'guided',
    label: "Guided questions",
    sublabel: "I need a prompt to get me started",
    icon: "💬"
  }
];
```

---

### Step 5 — Your First Moment

**`canAdvance`:** Always true. The forward button is the primary CTA. This step has no selections.

**No back button shown** — the host has completed setup. Going back would feel regressive.

**No skip link** — they're already done.

**Headline:**
```
"You're all set, {displayName}. Let's begin."
```
Font: Lora serif, 28px, warm brown (`#4A3728`).

**Body copy:** Adaptive based on `motivationType`:

```typescript
const getStep5Body = (motivation: MotivationType): string => {
  switch (motivation) {
    case 'emotional_depth':
      return "Start with something that matters to you — even a small memory is the beginning of something lasting.";
    case 'memory_preservation':
      return "Your memories are safe here. Let's capture the first one right now.";
    case 'external':
      return "Whoever asked you to do this — they'll be glad you did. Let's make a start.";
    case 'practical':
      return "Everything in its place. Let's set up your first piece of your Memento.";
    case 'explorer':
    default:
      return "No pressure — take a look around and start wherever feels right.";
  }
};
```

**Primary CTA button:** Adaptive based on `motivationType` × `expressionMode`:

```typescript
interface CTAConfig {
  label: string;
  action: 'voice_recorder' | 'reflection_prompt' | 'file_upload' | 'time_capsule' | 'dashboard';
}

const getPrimaryCTA = (motivation: MotivationType, modes: ExpressionMode[]): CTAConfig => {
  const hasVoice   = modes.includes('voice');
  const hasWriting = modes.includes('writing');
  const hasMedia   = modes.includes('media');
  const hasGuided  = modes.includes('guided');

  if (motivation === 'practical') {
    return { label: "Create your first time capsule", action: 'time_capsule' };
  }
  if (motivation === 'explorer') {
    return { label: "Take me to my dashboard", action: 'dashboard' };
  }
  if (motivation === 'memory_preservation' && hasMedia) {
    return { label: "Upload something precious", action: 'file_upload' };
  }
  if (hasVoice) {
    return { label: "Record your first memory", action: 'voice_recorder' };
  }
  if (hasGuided || hasWriting) {
    return { label: "Answer your first prompt", action: 'reflection_prompt' };
  }
  if (hasMedia) {
    return { label: "Upload something precious", action: 'file_upload' };
  }
  // fallback
  return { label: "Take me to my dashboard", action: 'dashboard' };
};
```

**Secondary link (always shown below primary CTA):**
```
"Or take me to the dashboard — I'll explore on my own →"
Action: navigate to /dashboard
Style: small, muted text (#B0A098), no button styling
```

---

## 7. SelectionCard Component

Build a reusable `SelectionCard` component used across Steps 1–4.

```typescript
interface SelectionCardProps {
  value: string;
  label: string;
  sublabel?: string;
  icon: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;   // used when max selections reached on multi-select
}
```

**States:**

| State | Border | Background | Opacity |
|---|---|---|---|
| Default | `1.5px solid #E4D9CC` | `#FFFCF8` | 100% |
| Hover | `1.5px solid #E8B99A` | `#FFFCF8` | 100% |
| Selected | `1.5px solid #C8956C` | `#F5E6DA` | 100% |
| Disabled | `1.5px solid #E4D9CC` | `#FAF7F2` | 50% |
| Focus (keyboard) | `2px solid #C8956C` + outer ring | — | 100% |

Selected state also renders a checkmark badge:
- Position: absolute, top-right corner (8px from top, 8px from right)
- Size: 18px circle
- Background: `#C8956C`
- Icon: white tick (✓), 10px

**Transitions:** `border-color 150ms ease`, `background 150ms ease`

**Minimum tap target:** 48px height. Cards should be taller than this naturally, but enforce `min-height: 48px`.

---

## 8. Step Transitions

Between steps, animate the outgoing step out and incoming step in.

```
Outgoing: opacity 1→0, translateY 0→-12px, duration 180ms ease-in
Incoming: opacity 0→1, translateY 12px→0, duration 220ms ease-out
Delay incoming by 160ms (starts before outgoing fully completes)
```

Do not use a library for this unless one is already in the codebase. A simple CSS class toggle with `transition` is sufficient.

---

## 9. Dashboard Nudge Banner

When `onboarding_complete: false` on dashboard load, render a persistent banner.

```
Position:    Top of dashboard content area, below topbar
Style:       Warm amber-pale background (#F5E6DA), amber left border (4px), rounded (12px)
Dismissible: Yes — small ✕ button on right. Dismissing sets onboarding_skipped: true locally
             but does NOT set onboarding_complete: true. Banner reappears on next login
             until onboarding is actually completed.

Copy:        "Finish setting up your Memento — it only takes a few minutes."
CTA:         "Continue setup →"   → navigates to /onboarding (resumes from last step)
```

Do not show the nudge banner if the host is on `/onboarding`.

---

## 10. API Contract

### Save onboarding data
`POST /api/host/onboarding`

**Request body:**
```typescript
{
  displayName: string;
  hostArchetype: string;
  hostArchetypeFreetext?: string;
  motivationType: string;
  priorityDimensions: string[];
  expressionMode: string[];
  isComplete: boolean;
  stepReached: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  enrichmentScoreSeed: Record<DimensionKey, number>;
}
```

The backend computes `enrichmentScoreSeed` using the following logic:
```
selectedDimensions   → weight 1.2
unselectedDimensions → weight 0.8
baseline (no data)   → weight 1.0
```

### Save step progress (intermediate)
`PATCH /api/host/onboarding/progress`

```typescript
{
  stepReached: number;
  // partial state — only the fields completed so far
}
```

Call this on every step advance so progress is preserved server-side, not just in `localStorage`.

---

## 11. Validation Summary

| Step | Required to advance | Error message |
|---|---|---|
| 1 | `displayName` non-empty + `hostArchetype` selected | Name: "We'd love to know what to call you." / Archetype: "Please pick the option that fits best." |
| 2 | `motivationType` selected | "Please choose the one that feels most like you." |
| 3 | `priorityDimensions.length >= 1` | "Even just one is a great place to start." |
| 4 | `expressionMode.length >= 1` | "Pick at least one — you can always change it later." |
| 5 | No validation — always advanceable | — |

Validation is triggered on forward button click only — never on blur or real-time. Show error messages inline, below the relevant component, in amber text (`#C8956C`), 13px.

---

## 12. Accessibility Requirements

- All interactive elements keyboard-focusable (`tabIndex` managed correctly)
- `Enter` or `Space` activates card selection
- `Tab` moves between cards in logical DOM order
- Forward button: `Enter` advances when focused
- Back button: `Enter` goes back when focused
- No auto-advance — user always controls progression
- No time limits anywhere in the flow
- All card labels and sublabels are visible text — not tooltips, not aria-label only
- Focus trap within the onboarding shell while flow is active

---

## 13. Revisit Mode (Settings)

Triggered by `GET /onboarding?mode=revisit`.

On mount in revisit mode:
1. Fetch existing host record from `GET /api/host/profile`
2. Pre-populate all `onboardingState` fields from the record
3. Set `currentStep: 1` — user goes through the full flow again
4. All cards show previously selected states on load
5. Forward button on Step 5 reads `"Save changes →"` instead of `"Let's begin →"`
6. On completion, `POST /api/host/onboarding` overwrites the existing record

No skip link in revisit mode — they're here intentionally.

---

## 14. Design Tokens (Reference)

```css
--cream:        #FAF7F2;
--warm-white:   #FFFCF8;
--sand:         #F0E9DF;
--sand-dark:    #E4D9CC;
--amber:        #C8956C;
--amber-light:  #E8B99A;
--amber-pale:   #F5E6DA;
--brown:        #7A5C45;
--brown-dark:   #4A3728;
--text-primary: #2C1F15;
--text-secondary:#7A6A5E;
--text-muted:   #B0A098;
--green-soft:   #8BAF8B;

Font headings: Lora, serif
Font body:     DM Sans, sans-serif
```
