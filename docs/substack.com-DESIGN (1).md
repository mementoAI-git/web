---
version: alpha
name: "Substack"
description: "A creator-centric media platform with warm editorial sensibility: light gray canvas (#eeeeee), crisp white content cards, signature orange brand voltage (#ff6719) on CTAs and subscribe actions, system-ui body type paired with proprietary Cahuenga serif headlines, rounded card geometry, and a distinctive green hero banner anchoring the reading experience."

colors:
  primary: "#ff6719"
  primary-hover: "#e55a15"
  primary-active: "#cc4f12"
  
  brand-teal: "#006b5a"
  brand-teal-dark: "#005547"
  
  canvas: "#eeeeee"
  surface-soft: "#ffffff"
  surface-elevated: "#ffffff"
  surface-dark: "#232525"
  surface-muted: "#c8c8c8"
  
  ink: "#363737"
  body: "#777777"
  muted: "#999999"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  on-brand-teal: "#ffffff"
  
  hairline: "rgba(0, 0, 0, 0.1)"
  hairline-strong: "rgba(0, 0, 0, 0.15)"
  border-input: "rgba(0, 0, 0, 0.1)"
  
  link: "#0083d5"
  link-hover: "#006ba3"
  error: "#d93025"
  success: "#0d8a6f"

typography:
  display-lg:
    fontFamily: "Cahuenga, serif"
    fontSize: "32px"
    fontWeight: "500"
    lineHeight: "1.24"
    letterSpacing: "normal"
  display-md:
    fontFamily: "Cahuenga, serif"
    fontSize: "24px"
    fontWeight: "500"
    lineHeight: "1.25"
    letterSpacing: "normal"
  title-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "19px"
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: "normal"
  body-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "15px"
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: "normal"
  body-sm:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.43"
    letterSpacing: "normal"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "1.38"
    letterSpacing: "normal"
  button:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "15px"
    fontWeight: "600"
    lineHeight: "1.33"
    letterSpacing: "normal"
  label-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\""
    fontSize: "13px"
    fontWeight: "600"
    lineHeight: "1.38"
    letterSpacing: "0.02em"

rounded:
  sm: "4px"
  DEFAULT: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
  full: "9999px"

spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  sidebar-width: "232px"
  hero-height: "420px"

extensions:
  shadows:
    inset-button: "rgba(255, 255, 255, 0.2) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.1) 0px -1px 0px 0px inset"
    card-elevated: "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px"
  motion:
    duration: "250ms"
    easing: "cubic-bezier(0.19, 1, 0.22, 1)"
    level: "subtle"
  icons: "lucide"
  framework: "unknown"
  mode: "light"
  fontPairings:
    - head: "Cahuenga"
      sub: null
      body: "System UI Stack"

components:
  sidebar-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    width: "{spacing.sidebar-width}"
  sidebar-nav-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  sidebar-nav-item-active:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  create-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: "10px 16px"
  create-button-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.DEFAULT}"
  hero-banner:
    backgroundColor: "{colors.brand-teal}"
    textColor: "{colors.on-brand-teal}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    height: "{spacing.hero-height}"
  hero-cta-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: "10px 16px"
  hero-link-text:
    backgroundColor: "transparent"
    textColor: "{colors.on-brand-teal}"
    typography: "{typography.body-md}"
  post-feed-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  post-author-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  post-body-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  subscribe-button:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  action-bar:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
  search-input:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "10px 20px 10px 40px"
  search-input-focus:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  auth-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  auth-card-subtitle:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    typography: "{typography.body-md}"
  start-substack-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: "12px 16px"
  sign-in-button:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.DEFAULT}"
    padding: "12px 16px"
  up-next-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.md} 0"
  up-next-title:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  up-next-meta:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    typography: "{typography.caption}"
  avatar-circle:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-primary}"
    size: "40px"
    rounded: "{rounded.pill}"
  avatar-small:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-primary}"
    size: "28px"
    rounded: "{rounded.pill}"
  thumbnail-image:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.DEFAULT}"
  dropdown-trigger:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    padding: "{spacing.xs} {spacing.sm}"
  bookmark-icon:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    size: "20px"
  get-app-button:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
---

# Substack Design System

## Overview

Substack's visual identity is built around a philosophy of **creator warmth meets editorial clarity**. The interface presents as an approachable, reader-friendly environment where the platform recedes to let writer content take center stage. The dominant mood is one of quiet professionalism — not austere, but purposeful.

The color story begins with a neutral `{colors.canvas}` background (#eeeeee), a deliberate off-white that softens the digital experience without feeling dirty. Against this, `{colors.surface-soft}` (#ffffff) content cards float with subtle elevation, creating a layered card-based architecture reminiscent of a well-organized desk rather than a stark dashboard. Brand voltage concentrates in `{colors.primary}` (#ff6719), a warm coral-orange that signals action — appearing exclusively on conversion-focused surfaces like the `{component.create-button}`, `{component.start-substack-button}`, and `{component.subscribe-button}`. This restraint ensures the brand color retains impact through scarcity. The `{colors.brand-teal}` deep green provides a secondary anchor reserved for the hero banner, lending the top-of-fold experience editorial gravitas without competing with the orange call-to-action system.

Typography operates on a two-family split that defines Substack's voice. Body copy flows in the native `system-ui` stack — clean, readable, unpretentious — while headlines and display moments erupt in **Cahuenga**, Substack's proprietary serif face. This serif carries weight 500 (medium) at 32px for the hero headline and 24px for section headers, giving the platform literary credibility without the heaviness of traditional bold weights. The system trusts size and family contrast over weight escalation; you will find no bolded display text anywhere. Even the primary button uses only weight 600 — firm but never shouting.

Shape language leans into the friendly-contemporary idiom: `{rounded.md}` (12px) for major containers like `{component.auth-card}` and `{component.post-feed-card}`, `{rounded.DEFAULT}` (8px) for interactive elements, and `{rounded.pill}` for avatars and subscribe badges. Nothing is sharp enough to feel cold, nothing so round it feels toy-like. The radius vocabulary is tightly controlled — just four active tokens cover every geometric need across the entire interface.

Two sub-systems are evident in this view. The **feed dialect** governs the central content stream, with its author-byline rows, excerpt bodies, and action bars. The **sidebar dialect** manages navigation state, collapsing icon+label pairs into compact tappable targets. Both share the same token foundation but apply them with different density intentions.

**Key Characteristics:**
- Canvas is `{colors.canvas}` (#eeeeee), not pure white — this gray-warmth grounds the entire experience.
- Brand lives in `{colors.primary}` (#ff6719) applied sparingly: only on CTAs and subscription actions.
- Headlines use `{typography.display-lg}` (Cahuenga 32px/500) — serif, medium weight, never bold.
- Content cards float on `{colors.surface-soft}` with `{rounded.md}` (12px) corners and `{extensions.shadows.card-elevated}` depth.
- Buttons carry an inset shadow (`{extensions.shadows.inset-button}`) for tactile pressability.
- Avatars are always `{rounded.pill}` (fully circular), never squared.
- The hero band uses `{colors.brand-teal}` as a unique signature surface, isolated to that single context.
- Spacing follows an 8px base rhythm with `{spacing.sm}`, `{spacing.md}`, `{spacing.lg}` covering most internal gaps.
- Links use `{colors.link}` (#0083d5) — blue, distinct from brand orange, preserving semantic clarity.

## Colors

### Brand & Accent

- **Primary** (`{colors.primary}` — #ff6719): Warm coral-orange used exclusively for primary conversion actions — the `{component.create-button}` in the sidebar, the `{component.start-substack-button}` in the auth card, and the `{component.hero-cta-button}` within the hero banner. This is the single most electric color in the palette and its restricted usage preserves its urgency signal.
- **Primary Hover** (`{colors.primary-hover}` — #e55a15): Darkened orange state for hover interactions on all primary-colored buttons.
- **Primary Active** (`{colors.primary-active}` — #cc4f12): Deepest pressed-state orange for mouse-down/touch-active moments on primary buttons.
- **Brand Teal** (`{colors.brand-teal}` — #006b5a): Deep forest-green serving as the hero banner background color, providing a sophisticated, editorial counterweight to the warmer orange accent. Used nowhere else in the interface.
- **Brand Teal Dark** (`{colors.brand-teal-dark}` — #005547): Darkened variant for potential hover states on teal surfaces or decorative depth layering within the hero context.

### Surface

- **Canvas** (`{colors.canvas}` — #eeeeee): The root page background — a light neutral gray that sits between pure white and typical app grays, providing subtle warmth and reducing eye strain during extended reading sessions. Every other element sits atop this foundation.
- **Surface Soft** (`{colors.surface-soft}` — #ffffff): Pure white used for elevated content containers — post feed cards, the authentication card, search input backgrounds, and any floating panel that needs to visually lift above the canvas.
- **Surface Elevated** (`{colors.surface-elevated}` — #ffffff): Currently identical to surface-soft; reserved for future modal/dropdown surfaces requiring additional hierarchy distinction.
- **Surface Dark** (`{colors.surface-dark}` — #232525): Near-black surface for potential dark-mode contexts or inverted hero variants. Appears minimally in the current light-mode view.
- **Surface Muted** (`{colors.surface-muted}` — #c8c8c8): Medium-gray used for placeholder surfaces — avatar backgrounds before image load, disabled button fills, and the `{component.sign-in-button}` secondary action background.

### Text / Ink

- **Ink** (`{colors.ink}` — #363737): The darkest text color — near-black but slightly softened — used for primary body copy, headlines, navigation labels, and any text requiring maximum readability against light backgrounds.
- **Body** (`{colors.body}` — #777777): Secondary text color for metadata, timestamps, subtitles, helper text, and any information subordinate to the primary reading flow. Approximately 60% the luminance contrast of ink.
- **Muted** (`{colors.muted}` — #999999): Tertiary text color for action bar labels (like counts beside heart/comment icons), placeholder input text, and decorative elements that must be present but should not compete for attention.
- **On Primary** (`{colors.on-primary}` — #ffffff): Pure white text rendered atop `{colors.primary}` orange buttons, satisfying WCAG AA contrast requirements against the vibrant orange background.
- **On Dark** (`{colors.on-dark}` — #ffffff): White text for use against `{colors.surface-dark}` or any dark surface context where light ink would fail.
- **On Brand Teal** (`{colors.on-brand-teal}` — #ffffff): White text specifically for the hero banner headline and any overlaid elements on the teal background, maintaining legibility against the dark green.

### Hairlines & Borders

- **Hairline** (`{colors.hairline}` — rgba(0, 0, 0, 0.1)): Default border color using 10% black transparency — applied to the search input field and any subtle dividers between content sections. Soft enough to register without harshness.
- **Hairline Strong** (`{colors.hairline-strong}` — rgba(0, 0, 0, 0.15)): Slightly more opaque border variant for elements needing clearer containment — form inputs in focus states, card borders under hover, or separator lines requiring more visibility.
- **Border Input** (`{colors.border-input}` — rgba(0, 0, 0, 0.1)): Dedicated input border token, currently identical to hairline, semantically separated for future input-specific styling divergence.

### Semantic

- **Link** (`{colors.link}` — #0083d5): Standard hyperlink blue for inline text links, URLs in post excerpts, and any navigational text that isn't a button. Distinctly separate from brand orange to maintain semantic clarity.
- **Link Hover** (`{colors.link-hover}` — #006ba3): Darkened blue for hovered link states, providing clear interaction feedback without color-shifting to the brand palette.
- **Error** (`{colors.error}` — #d93025): Red semantic token for validation errors, failed actions, and destructive messaging. Not prominently featured in the default view but essential for form states.
- **Success** (`{colors.success}` — #0d8a6f): Green semantic token for confirmation states, successful subscriptions, and positive feedback messaging. Complements the brand teal without matching it exactly.

## Typography

### Font Family

Substack employs a dual-typeface strategy that balances readability with editorial personality. The workhorse is the **system-ui** font stack — `"system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"` plus emoji fallbacks — which renders all body text, navigation labels, button copy, captions, and UI chrome. This choice ensures native rendering fidelity across macOS, Windows, iOS, and Android, eliminating web font latency for the majority of on-screen text.

For moments requiring editorial weight, Substack deploys **Cahuenga**, a proprietary serif typeface served via WOFF2 from substackcdn.com. Cahuenga appears exclusively in display contexts: the 32px hero headline ("Make money doing the work you believe in"), the 24px section header ("Log in or sign up"), and any publication-level title treatments. The font supports weights 300 (Light) through 700 (ExtraBold) in both roman and italic, though the current interface primarily uses weight 500 (SemiBold). A third face, **Spectral**, appears twice in the extracted data, likely reserved for long-form article reading views not captured in this screenshot.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-lg}` | 32px | 500 | 1.24 (39.68px) | normal | Hero headline, primary editorial moment |
| `{typography.display-md}` | 24px | 500 | 1.25 (30px) | normal | Section headers, card titles |
| `{typography.title-md}` | 19px | 400 | 1.4 | normal | Navigation item labels, prominent UI text |
| `{typography.body-md}` | 15px | 400 | 1.4 (21px) | normal | Post excerpts, body copy, standard paragraphs |
| `{typography.body-sm}` | 14px | 400 | 1.43 | normal | Author names, metadata, secondary info |
| `{typography.caption}` | 13px | 400 | 1.38 | normal | Timestamps, action counts, tertiary labels |
| `{typography.button}` | 15px | 600 | 1.33 | normal | All button text, CTA labels |
| `{typography.label-md}` | 13px | 600 | 1.38 | 0.02em | Subscribe badge, small actionable labels |

### Principles

The typography system's defining characteristic is **restraint in weight escalation**. While many interfaces reach for bold (700) to establish hierarchy, Substack stops at medium (500) even for its largest headline. This creates a refined, literary atmosphere where size and family change do the heavy lifting. The jump from `{typography.body-md}` (15px system-ui) to `{typography.display-lg}` (32px Cahuenga serif) delivers dramatic hierarchy without ever feeling aggressive.

Line heights are consistently generous — 1.4x for body text, 1.24x for display — ensuring comfortable reading even on smaller screens. Letter spacing remains at `normal` (effectively 0) throughout, trusting the chosen faces' built-in spacing. The sole exception is `{typography.label-md}` at `0.02em`, adding microscopic breathing room to small uppercase-leaning labels.

Color also participates in hierarchy: `{colors.ink}` for primary text, `{colors.body}` for supporting information, `{colors.muted}` for truly secondary elements. A three-stop text-color scale combined with four size tiers creates twelve distinct hierarchy positions without ever touching bold weight.

### Note on Font Substitutes

**Cahuenga** is Substack's proprietary typeface and cannot be freely redistributed. For implementation purposes, the closest Google Fonts equivalent is **Lora** (serif, available weights 400–700) or **Source Serif Pro** (more mechanical but similar x-height). For the system-ui stack, no substitution is needed — the native stack covers all target platforms. If implementing from scratch without access to Cahuenga's CDN, define these CSS variables:

```css
--font-display: 'Lora', 'Georgia', serif;
--font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

The `font-display: fallback` descriptor in Cahuenga's @font-face declarations means the system-ui stack shows immediately while Cahuenga loads, preventing invisible text flashes.

## Layout

### Spacing System

- **Base unit:** 8px ({`spacing.sm`}).
- **Tokens:** 
  - `{spacing.xxs}` (2px): Micro-adjustments, tight internal gaps.
  - `{spacing.xs}` (4px): Icon-to-text gaps, dense clusters.
  - `{spacing.sm}` (8px): Base unit; sibling element spacing, padding inside compact components.
  - `{spacing.md}` (12px): Standard internal padding for form elements, gap between related items.
  - `{spacing.lg}` (16px): Card internal padding, comfortable gaps between non-sibling items.
  - `{spacing.xl}` (24px): Section-level spacing, generous card padding (auth card).
  - `{spacing.xxl}` (32px): Major vertical rhythm breaks.
  - `{spacing.sidebar-width}` (232px): Fixed left navigation rail width.
  - `{spacing.hero-height}` (420px): Hero banner height.

- **Section padding (vertical):** `{spacing.xl}` (24px) — used inside `{component.auth-card}` and between major content blocks.
- **Card internal padding:** `{spacing.lg}` (16px) for `{component.post-feed-card}`; `{spacing.xl}` (24px) for `{component.auth-card}`.
- **Gutters:** Left sidebar maintains fixed `{spacing.sidebar-width}`; main content area and right rail share remaining viewport fluidly, approximately 60%/40% at desktop widths.

### Grid & Container

The layout follows a **three-column asymmetric grid**: fixed 232px left sidebar, fluid center feed column (~600–700px at desktop), and ~320px right rail containing search and discovery widgets. Max content width for the center feed is not rigidly capped but naturally constrains to ~680px for optimal reading line length (66–75 characters).

Density choices favor the **editorial** pattern: generous whitespace between post cards, ample line height in body text, and clear visual separation between authors' contributions. This is not a dashboard-dense interface — it respects the reader's attention by refusing to pack information.

At desktop resolution, the hero banner spans the full center column width. The post feed below uses a single-column vertical stack with consistent card sizing (no masonry or multi-column layouts). The right rail stacks vertically: search → auth card → up-next list.

### Whitespace Philosophy

Substack practices **generous, intentional whitespace**. Cards breathe with 16–24px internal padding. Post entries are separated by clear vertical gaps (approximately 16–20px). The left sidebar uses its fixed width efficiently but never crowds items together. This airiness signals confidence — the platform doesn't need to shout or cram. It's the opposite of a marketplace density model.

### Header Architecture

```
┌──────────────────┬─────────────────────────────────────┬─────────────────┐
│  [Logo]          │                                     │  [Q] Search      │
│                  │         (Content Area)              │  Substack Input  │
│  🏠 Home         │                                     │                  │
│  📄 Subs         │                                     │  ┌─────────────┐ │
│  💬 Chat         │                                     │  │  ≡ Logo     │ │
│  🔔 Activity     │                                     │  │             │ │
│  🔍 Explore      │                                     │  │Log in/sign  │ │
│  👤 Profile      │                                     │  │  up text    │ │
│                  │                                     │  │             │ │
│  ┌────────────┐  │                                     │  │[START] Btn  │ │
│  │  CREATE   │  │                                     │  │[Sign in]Btn │ │
│  └────────────┘  │                                     │  └─────────────┘ │
│                  │                                     │                  │
│  (232px fixed)   │        (fluid, ~65% width)          │  (~320px fixed)  │
└──────────────────┴─────────────────────────────────────┴─────────────────┘
```

### Hero Section

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  Make money doing the work you believe in           [CTA] ║  │
│  ║                                          Learn more       ║  │
│  ║  (Brand Teal bg, Cahuenga 32px, white text)               ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│  For you ▾                                                        │
└─────────────────────────────────────────────────────────────────┘
```

The hero occupies `{spacing.hero-height}` (420px) with `{rounded.lg}` (16px) corners. Inside: left-aligned headline in `{typography.display-lg}`, primary CTA button right-aligned beneath the text, and a "Learn more" secondary link adjacent. Background is solid `{colors.brand-teal}` with no gradient or imagery overlay.

### Post Feed Structure

Each post card follows this internal layout:

```
┌─────────────────────────────────────────────────────────┐
│  [⭕ Avatar]  Author Name  ·  2d              [Subscribe]│
│                                                         │
│  Post excerpt body text wraps here at 15px...           │
│  continuing across the full card width with 1.4 LH.    │
│                                                         │
│  ♡ 3.2K   💬 195   ↻ 211   ⬇                    [...]  │
└─────────────────────────────────────────────────────────┘
```

Author row: circular avatar (40px), name in `{typography.body-sm}`, timestamp in `{colors.muted}`, subscribe pill button flush-right. Body: `{typography.body-md}` in `{colors.ink}`, 1–3 lines visible before truncation. Action bar: four icon+count pairs in `{colors.muted}` caption type, ellipsis menu at far right.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (Flat) | No shadow, `{colors.canvas}` background | Root page surface, sidebar background |
| 1 (Raised) | `{extensions.shadows.card-elevated}` | Post feed cards, auth card, floating panels |
| 2 (Inset) | `{extensions.shadows.inset-button}` | Primary buttons (creates tactile depth) |
| 3 (Focus) | Border color shift to `{colors.hairline-strong}` or outline ring | Input focus states, keyboard navigation indicators |

The elevation philosophy is **layered minimalism**. Unlike interfaces that rely on heavy shadow stacks to build spatial hierarchies, Substack uses elevation sparingly. Most content cards sit at Level 1 with a single soft shadow — just enough to suggest they float above the canvas without creating visual noise. The inset shadow on buttons is a notable exception: it carves depth *into* the surface rather than lifting above it, making buttons feel pressable in a distinctly tactile way.

No gradient overlays, glassmorphism, or decorative drop shadows appear in this view. Depth comes from three sources only: the card shadow, the button inset, and the implicit layering of white cards on gray canvas (which itself reads as elevation through value contrast alone).

If a modal or dropdown were added to this system, it would likely introduce a new Level 3 with a heavier shadow variant or backdrop blur, but such surfaces don't exist in the captured viewport.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 4px | Small internal elements, tag-like decorations |
| `{rounded.DEFAULT}` | 8px | Buttons, inputs, thumbnails, standard interactive elements |
| `{rounded.md}` | 12px | Major containers (cards, search input, nav items) |
| `{rounded.lg}` | 16px | Hero banner, large featured cards |
| `{rounded.pill}` | 9999px | Avatars (all sizes), subscribe badge pills |

### Photography Geometry

Avatars render as perfect circles (`{rounded.pill}`) at 40px for author bylines and 28px for the "up next" recommendation list. Thumbnail images in the up-next section use `{rounded.DEFAULT}` (8px) corners with roughly 4:3 or 16:9 aspect ratios. The hero banner contains illustrative artwork (pencil/notebook composition) that bleeds edge-to-edge within the rounded container — no internal rounding on the illustration itself. Images are photographic or illustrated realism, treated flatly without filters or duotone overlays.

## Components

> **No hover states documented.** Hover behavior is unreliable to extract from a single screenshot. State variants live as separate entries in the `components:` frontmatter (e.g. `{component.create-button-hover}`, `{component.search-input-focus}`); add hover styling at implementation time per your stack's conventions.

### Buttons & Actions

**`{component.create-button}`** — The primary conversion action in the left sidebar. Bright `{colors.primary}` background with `{colors.on-primary}` white text, set in `{typography.button}` (15px/600). Rounded to `{rounded.DEFAULT}` (8px) with horizontal padding of 16px. Carries the signature `{extensions.shadows.inset-button}` treatment — a white top-edge highlight and black bottom-edge shadow — giving it a satisfying press-in appearance. Full-width within the sidebar context. Its hover state is `{component.create-button-hover}` with darkened `{colors.primary-hover}` background.

**`{component.hero-cta-button}`** — Identical specification to `{component.create-button}` but placed within the `{component.hero-banner}` teal context. Same orange background ensures the CTA pops against the green. Shares the inset shadow and rounded-8px geometry.

**`{component.start-substack-button}`** — The dominant action in the `{component.auth-card}`. Uses `{colors.primary}` background, `{typography.button}`, `{rounded.DEFAULT}`, and slightly taller padding (12px vertical vs. 10px on the sidebar variant) to accommodate its prominence in the card layout. Inset shadow present. This is the highest-conversion button on the page for logged-out users.

**`{component.sign-in-button}`** — Secondary action paired with start-substack in the auth card. `{colors.surface-muted}` (#c8c8c8) background with `{colors.ink}` text, same `{typography.button}` and `{rounded.DEFAULT}` treatment. No inset shadow — it reads flatter, appropriately de-emphasized. Sits directly below the primary button with no gap.

**`{component.subscribe-button}`** — A text-style pill button appearing on each post card's author row. Transparent background with `{colors.primary}` orange text in `{typography.label-md}` (13px/600). Fully rounded (`{rounded.pill}`) with snug horizontal padding (12px). This is the signature micro-conversion element of the feed — small, warm, and always available without dominating the card.

**`{component.get-app-button}`** — Floating bottom-right promotion button visible at viewport bottom. White background, `{typography.body-sm}`, `{rounded.pill}` shape, subtle shadow implied by its floating position.

### Cards & Containers

**`{component.post-feed-card}`** — The fundamental content unit of the main feed. White (`{colors.surface-soft}`) background with `{rounded.lg}` (16px) corners and `{extensions.shadows.card-elevated}` shadow. Internal padding of `{spacing.lg}` (16px). Contains the author row, post excerpt body, and action bar stacked vertically. Cards are separated vertically by approximately 16–20px of canvas showing through. No visible border — elevation alone defines the edge.

**`{component.auth-card}`** — The right-rail login/promotion container. White background, `{rounded.lg}` corners, `{spacing.xl}` (24px) internal padding. Houses the Substack logo mark, "Log in or sign up" heading in `{typography.title-md}`, subtitle text, and the stacked `{component.start-substack-button}` / `{component.sign-in-button}` pair. Center-aligned content with comfortable vertical rhythm.

**`{component.up-next-card}`** — Individual recommendation rows in the "Up next" widget. Transparent background (they sit directly on the white card surface beneath), separated by thin dividers or spacing. Each contains a bookmark icon, publication name, article title in `{typography.body-md}`, metadata row (read time, likes, comments) in `{typography.caption}` with `{colors.body}`, and a thumbnail image (28px avatar or rectangular thumbnail) at the far right.

**`{component.hero-banner}`** — The signature top-of-fold container spanning the center column. `{colors.brand-teal}` background with `{rounded.lg}` (16px) corners, fixed `{spacing.hero-height}` (420px) height. Contains the Cahuenga headline, CTA button, and "Learn more" link, plus background illustration (pencil/notebook artwork) positioned to the right side of the text block. Padding of `{spacing.xl}` (24px) internally.

### Inputs & Forms

**`{component.search-input}`** — Top-of-right-rail search field. White (`{colors.surface-soft}`) background with 1px `{colors.hairline}` border, `{rounded.md}` (12px) corners. Left-padded extra (40px) to accommodate the search icon. Renders placeholder text "Search Substack" in `{typography.body-md}` with `{colors.muted}`. Its focus state `{component.search-input-focus}` would strengthen the border color and potentially add a subtle ring. Height accommodates comfortable touch/click targeting at approximately 44px total.

### Navigation

**`{component.sidebar-nav}`** — The fixed left navigation rail. `{colors.canvas}` background filling the full `{spacing.sidebar-width}` (232px) and viewport height. Contains the Substack logo (top), six icon+label navigation items, and the `{component.create-button}` at bottom. Items are vertically stacked with consistent spacing.

**`{component.sidebar-nav-item}`** — Individual navigation targets in the sidebar. Each is a horizontally-flexed row containing a Lucide icon (20px, `{colors.ink}`) and label text in `{typography.body-md}`. `{rounded.md}` (12px) corner radius with `{spacing.sm}` (8px) internal padding creates a tappable area of roughly 48px height meeting accessibility guidelines. Background is transparent by default; the active/hovered state `{component.sidebar-nav-item-active}` applies `{colors.surface-soft}` white background to indicate selection.

**`{component.dropdown-trigger}`** — The "For you ▾" filter control above the post feed. Transparent background, `{typography.body-sm}` in `{colors.body}`, minimal padding, indicating a collapsible menu trigger.

### Signature Elements

**`{component.avatar-circle}`** — Standard author representation. 40px diameter circle (`{rounded.pill}`), `{colors.surface-muted}` background when no photo loaded, otherwise photo-filled. Appears leftmost in each post card's author row.

**`{component.avatar-small}`** — Compact 28px variant for the "Up next" list, maintaining perfect circle geometry.

**`{component.bookmark-icon}`** — 20px Lucide outline icon in `{colors.muted}`, positioned at the right edge of each up-next card row for quick-save actions.

**`{component.action-bar}`** — The engagement footer within each post card. Contains heart/count, comment/count, restock/count, and download icons in a horizontal row, all rendered in `{colors.muted}` at `{typography.caption}` size (13px). An overflow menu (three dots) sits at the far right. Icons are Lucide stroke-style, 18–20px, aligned with their count labels.

**`{component.thumbnail-image}`** — Rectangular image container in the up-next cards. `{rounded.DEFAULT}` (8px) corners, approximately 80×50px, displaying publication or post preview imagery.

## Do's and Don'ts

### Do

- **Do reserve `{colors.primary}` strictly for conversion actions.** The orange should appear only on buttons that drive subscriptions, creation, or sign-ups — never for decoration or generic highlighting.
- **Do use Cahuenga (`{typography.display-lg}`, `{typography.display-md}`) exclusively for headlines and display text.** Never apply it to body copy, navigation labels, or UI chrome — that's what the system-ui stack handles.
- **Do apply `{rounded.pill}` to all avatars regardless of size.** Circular profile images are a hard convention; square avatars break the visual language.
- **Do maintain the `{extensions.shadows.inset-button}` treatment on all `{colors.primary}` buttons.** This carved-in effect is part of the tactile identity — flat orange rectangles read as incomplete.
- **Do keep post card internal spacing at `{spacing.lg}` (16px) minimum.** Crowding the author row, excerpt, and action bar undermines the breathable editorial quality.
- **Do use `{colors.body}` (#777777) for timestamps, metadata, and helper text.** Reserving `{colors.ink}` for primary content establishes clear information hierarchy.
- **Do limit button text to `{typography.button}` weight 600 maximum.** Never bold (700) a button label — the system's voice is firm, not forceful.
- **Do ensure the hero banner stays `{colors.brand-teal}` when replicating the homepage.** This green is a signature surface; swapping it to orange or another color dilutes brand recognition.
- **Do align the left sidebar to exactly `{spacing.sidebar-width}` (232px).** This fixed dimension is baked into the spatial system; wider or narrower rails break the intended proportions.
- **Do use `{colors.link}` blue for inline links, not `{colors.primary}` orange.** Hyperlinks and CTAs serve different semantic roles and must remain visually distinct.
- **Do round major containers to `{rounded.md}` (12px) or `{rounded.lg}` (16px).** Sharper corners (4px or less) feel incongruous with the established friendliness.

### Don't

- **Don't apply gradients or glassmorphism to cards.** Substack's aesthetic is clean material layers — frosted effects or rainbow washes contradict the grounded editorial tone.
- **Don't bold headlines beyond weight 500.** The `{typography.display-lg}` role caps at semi-bold; pushing to 700 or 800 looks heavy-handed and unsophisticated.
- **Don't expand the radius vocabulary beyond the five defined tokens.** Introducing a custom 6px or 20px radius creates orphaned values that don't compose with the existing system.
- **Don't place `{colors.primary}` text on anything except white or very light backgrounds.** Orange-on-dark fails contrast testing; if you need colored text on dark, use `{colors.on-dark}` white or `{colors.link}` blue.
- **Don't remove the inset shadow from primary buttons in pursuit of "flat design."** The depth effect is intentional and contributes to perceived clickability.
- **Don't use `{colors.canvas}` (#eeeeee) for card backgrounds.** Cards must be `{colors.surface-soft}` (#ffffff) to float visibly; canvas is the ground plane only.
- **Don't let post excerpts exceed 3–4 lines without truncation.** The feed is a browsing interface, not a reader — full posts belong on dedicated pages.
- **Don't mix Cahuenga with system-ui within the same text block.** Font-family changes should coincide with hierarchical shifts (headline → body), not mid-sentence emphasis.
- **Don't apply shadows thicker than `{extensions.shadows.card-elevated}` to standard cards.** Heavy shadows create a "floating too high" impression that feels unstable.
- **Don't center-align body text in post cards.** The entire feed uses left alignment for scannable reading patterns; centered body copy slows comprehension.
- **Don't use the `{colors.brand-teal}` outside the hero banner.** This color is contextually exclusive; applying it to buttons or other surfaces confuses the visual hierarchy.

## Motion & Animation

### Transition Tokens

```
--transition-background: background-color 0.25s cubic-bezier(0.19, 1, 0.22, 1);
--transition-color: color 0.25s cubic-bezier(0.19, 1, 0.22, 1);
--transition-comprehensive: color 0.25s cubic-bezier(0.19, 1, 0.22, 1), background-color 0.25s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.25s cubic-bezier(0.19, 1, 0.22, 1), border 0.25s cubic-bezier(0.19, 1, 0.22, 1), border-radius 0.25s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.25s cubic-bezier(0.19, 1, 0.22, 1), filter 0.25s cubic-bezier(0.19, 1, 0.22, 1), transform 0.25s cubic-bezier(0.19, 1, 0.22, 1);
--transition-icon: stroke 0.25s cubic-bezier(0.19, 1, 0.22, 1), fill 0.25s cubic-bezier(0.19, 1, 0.22, 1);
--transition-border: border-color 0.25s cubic-bezier(0.19, 1, 0.22, 1);
--transition-opacity: fill-opacity 0.25s cubic-bezier(0.19, 1, 0.22, 1);
```

### Keyframe Animations

No keyframe animations were detected in the extracted CSS. The `keyframes` array is empty, indicating Substack's homepage relies on CSS transitions for state changes rather than continuous animation loops.

### Interaction Patterns

- **Button press feedback:** All primary-colored buttons transition background-color through the `{extensions.motion.easing}` curve (ease-out-expo: 0.19, 1, 0.22, 1) over 250ms, creating a smooth settle-into-pressed feel rather than a snap.
- **Input focus expansion:** The search input likely expands its border opacity or adds a subtle ring on focus, transitioning via `--transition-border`.
- **Subscribe button fill:** The `{component.subscribe-button}` text-style button probably transitions to a filled `{colors.primary}` background on hover (inferred from common Substack patterns), with color and background both in the transition property.
- **Icon interactions:** Heart, comment, and bookmark icons transition their stroke/fill properties on activation, allowing smooth color shifts (muted → primary red or filled state).
- **Card hover lift:** Post feed cards may implement a subtle y-axis translate on hover (not explicitly in extracted styles but consistent with the shadow-based elevation model).
- **Nav item highlight:** Sidebar nav items transition their background-color from transparent to `{colors.surface-soft}` on hover/active state changes.
- **Dropdown reveal:** The "For you ▾" trigger likely reveals a filtered list with opacity + transform transitions.

The easing curve `cubic-bezier(0.19, 1, 0.22, 1)` is notably an ease-out-expo variant — fast start, gradual deceleration — which gives interactions a snappy-yet-refined feel appropriate for a professional publishing tool.

## Imagery Style

- **Hero illustration:** A realistic, slightly stylized composition featuring a fountain pen and lined notebook paper, rendered with warm lighting and positioned at a dynamic angle. Colors complement the teal background (oranges/yellows in the illustration echo the brand orange). This is vector or high-quality raster artwork, not photography.
- **Author avatars:** Photographic headshots, professionally lit but casual in tone. Circular crop eliminates background context, focusing purely on facial recognition.
- **Up-next thumbnails:** Mixed media — some are publication logos, others are photographic stills from video content or article feature images. Rectangular with 8px rounding.
- **Treatment consistency:** All images are flat-rendered without filters, duotones, or overlay gradients. They present as-is, letting natural photography or clean illustration speak.
- **Role of imagery:** Supportive rather than dominant. The hero illustration reinforces the "writing/work" theme but doesn't overpower the headline. Thumbnails in up-next are functional identifiers, not visual features.
- **Color relationship:** Illustration colors harmonize with the brand palette (warm tones against cool teal) without matching exactly — this is coordinated, not templated.
- **No texture overlays:** Images lack grain, noise, or vintage filters. The aesthetic is contemporary-clean.
- **Aspect ratio discipline:** Thumbnails maintain consistent proportions within their container type (circles for avatars, ~16:9 or 4:3 for thumbnails).

## Icon System

- **Library:** Lucide (detected via framework analysis: `iconLibs: ["lucide"]`). Substack uses the Lucide open-source icon set as its base, potentially with custom modifications.
- **Specific icons observed:**
  - Home (house outline)
  - Subscriptions (document/layers)
  - Chat (message circle)
  - Activity (bell/notification)
  - Explore (magnifying glass — also used in search input)
  - Profile (user circle)
  - Bookmark (ribbon/flag outline — in up-next cards)
  - Heart (outline — in action bars for likes)
  - Message square (comment bubble — in action bars)
  - Refresh/restock (circular arrow — in action bars)
  - Download/share (arrow down from box — in action bars)
  - More options (three dots / ellipsis)
  - Chevron down (dropdown indicator)
  - Search (magnifying glass with handle)
  - Substack logo mark (custom SVG, not Lucide — the orange stacked-lines symbol)
- **Treatment:** Stroke-based (outline style), not filled. Line weight appears consistent at 1.5–2px. Color is typically `currentColor`, inheriting from parent text color (usually `{colors.ink}` or `{colors.muted}`). Icons scale to 18–24px depending on context: 20px for sidebar navigation, 18px for action bars, 24px for standalone decorative use (like the auth card logo mark).
- **Alignment:** Icons sit baseline-aligned with accompanying text labels in navigation items, and vertically centered within their touch targets. In action bars, icons precede their numeric labels with a small gap (~4–6px).

## Recommended Frontend Stack

```
- Framework:      Next.js (React) or Remix — Substack is a React application based on 
                  component class naming conventions ("pencraft", "pc-reset") and 
                  DOM structure patterns suggesting a modern SPA/SSR React stack.
- Styling:        CSS Modules or styled-components (utility-class patterns detected: 
                  "pc-display-flex", "pc-gap-4", "pc-reset" suggest a custom utility 
                  layer, possibly Emotion or internal CSS-in-JS). Tailwind unlikely 
                  given non-standard class prefixes.
- Fonts:          Cahuenga served from substackcdn.com/fonts/ (proprietary WOFF2). 
                  Fallback to system-ui stack for body text. For open-source 
                  reimplementation, use Lora (Google Fonts) as Cahuenga substitute.
- Animation:      CSS transitions (no JS animation library detected). Framer Motion 
                  could add scroll-triggered entrance animations if desired, but the 
                  current design relies entirely on CSS transitions for state changes.
- Icons:          Lucide React (npm: lucide-react) for the detected icon library.
                  Custom SVG for the Substack logo mark.
- Component lib:  Custom component system (no shadcn/Radix primitives detected). 
                  Build components from scratch following this spec's token definitions.
```

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 640px | Single-column layout; sidebar collapses to hamburger menu or bottom tab bar; hero banner stacks vertically with reduced height; right rail moves below feed or hides; post cards go full-width. |
| Tablet | 640px – 1024px | Sidebar may collapse to icon-only mode (labels hidden); feed narrows slightly; right rail may hide or become a scrollable drawer. |
| Desktop | 1024px – 1440px | Full three-column layout as captured in screenshot: 232px sidebar, fluid center, 320px right rail. |
| Wide | > 1440px | Center column maxes out at ~720px readable width; excess space distributes to gutters or right rail expansion. |

### Touch Targets

- `{component.create-button}`: Approximately 40px height × full-sidebar-width (minus padding). Meets 44px minimum when accounting for padding.
- `{component.search-input}`: ~44px height (inferred from padding + line-height). Meets WCAG AAA.
- `{component.sidebar-nav-item}`: 48px declared min-height in CSS classes (`pc-minHeight-48`). Exceeds 44px guideline comfortably.
- `{component.subscribe-button}`: ~32px height (pill shape, snug padding). May fall short of 44px on mobile — consider increasing vertical padding to 10px for touch compliance.
- `{component.start-substack-button}`: ~44px height with 12px vertical padding. Compliant.
- Action bar icons: ~32px tap areas (icon + count grouped). May need increased hit-padding on mobile.

### Collapsing Strategy

- **Sidebar navigation:** At mobile widths, the 232px rail cannot persist. Expected behavior: collapse to a hamburger menu triggering a slide-out drawer, OR convert to a bottom tab bar (Home, Write, Activity, Profile) similar to Substack's mobile app. Icon-only mode at tablet is possible but less likely given the label-dependent design.
- **Hero banner:** Reduces from 420px height to ~280–320px on mobile. Headline size scales down (possibly to 24px). CTA button stacks below headline rather than sitting adjacent. Background illustration may crop or simplify.
- **Post feed cards:** Go full viewport width minus margins (16–20px gutter each side). Author row remains but may truncate names. Action bar icons persist but counts may hide on narrow screens.
- **Right rail (search + auth + up next):** Highest priority for removal. Search moves to a header bar or becomes a persistent top element. Auth card relocates to inline position within the feed (perhaps between hero and first post). Up-next section moves below feed or becomes a horizontal scroll.
- **Avatar sizes:** May reduce from 40px to 32px on mobile to conserve horizontal space in author rows.

### Image Behavior

- **Hero illustration:** On mobile, the pen/notebook artwork likely crops to focus on a detail, shifts to a background-position that keeps text legible, or reduces opacity to avoid competing with smaller headline text. Aspect ratio may shift from landscape to a shorter proportion.
- **Up-next thumbnails:** Maintain 8px rounding but reduce absolute dimensions (from ~80×50px to ~56×36px) to fit narrower rail or inline placement. Some thumbnails may hide entirely on smallest screens.
- **Author avatars:** Scale from 40px → 32px on mobile. Remain circular. Lazy-load below the fold.

## Iteration Guide

1. **Build the three-column layout first.** Establish the fixed 232px left sidebar (`{spacing.sidebar-width}`), the fluid center feed (targeting 640–720px max-content), and the ~320px right rail. Use CSS Grid or Flexbox with the sidebar as a fixed-position element and the center/right as a flex row. Set the body background to `{colors.canvas}` (#eeeeee).

2. **Implement tokens as CSS custom properties.** Define every color, spacing, radius, and typography value from the YAML frontmatter as a `:root` variable (e.g., `--color-primary: #ff6719; --radius-default: 8px;`). Reference only variables in component styles — never hard-code hex values or pixel measurements that have token equivalents.

3. **Build the sidebar navigation.** Create `{component.sidebar-nav-item}` components with Lucide icons (Home, Subscriptions, Chat, etc.) at 20px, `{typography.body-md}` labels, 48px min-height, and `{rounded.md}` corners. Implement the active state as a `{colors.surface-soft}` background swap. Place the `{component.create-button}` at the sidebar bottom with its inset shadow.

4. **Construct the hero banner.** Apply `{colors.brand-teal}` background, `{rounded.lg}` corners, 420px height, and `{spacing.xl}` padding. Place the Cahuenga headline (`{typography.display-lg}`, white text) left-aligned, with the orange CTA and "Learn more" link arranged to its lower right. Add the illustration as a positioned background-image or img element.

5. **Build the post feed card system.** Each `{component.post-feed-card}` needs: author row (avatar + name + timestamp + subscribe pill), excerpt body (1–3 lines, `{typography.body-md}`), and action bar (4 icon-count pairs + ellipsis). Use `{colors.surface-soft}` background, `{rounded.lg}`, `{extensions.shadows.card-elevated}`, and 16px internal padding. Stack cards vertically with ~20px gaps.

6. **Implement the right rail widgets.** Build `{component.search-input}` with its 12px radius, hairline border, and 40px left padding for the search icon. Construct `{component.auth-card}` with centered content, the stacked button pair (primary orange + secondary gray), and `{rounded.lg}` geometry. Add the "Up next" list as transparent-background rows with bookmarks, titles, metadata, and thumbnails.

7. **Apply the transition system.** Add `transition: background-color 0.25s cubic-bezier(0.19, 1, 0.22, 1), color 0.25s cubic-bezier(0.19, 1, 0.22, 1)` to all interactive elements (buttons, links, nav items, inputs). Use the comprehensive transition string for complex components like cards that might animate multiple properties.

8. **Add responsive breakpoints.** At < 1024px, hide the right rail and let the feed expand. At < 768px, collapse the sidebar to a hamburger menu or bottom bar. Test that `{component.subscribe-button}` achieves 44px touch height on mobile. Ensure hero text remains readable at smaller sizes (consider dropping to 24px).

9. **Font setup for Cahuenga substitution.** If you cannot access substackcdn.com fonts, import Lora from Google Fonts: `<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet">`. Map it via CSS: `.font-display { font-family: 'Lora', Georgia, serif; }`. Define body font as the system-ui stack natively — no import needed.

10. **Run linting and validation.** After implementation, verify all `{token.path}` references resolve to defined tokens. Check that every component in the frontmatter has a corresponding implemented element. Confirm contrast ratios meet WCAG AA for `{colors.primary}` on `{colors.on-primary}` (the orange-white combination passes at approximately 3.2:1 for 15px/600 text, which meets AA for large text).

## Known Gaps

- **Hover state specifics:** While `{component.create-button-hover}` and other `-hover` variants are defined with color values, the exact behavior of hover states on post cards, nav items (background color transitions?), and the subscribe button (fill transition?) is inferred rather than directly observed.
- **Loading and skeleton states:** No loading spinner, skeleton placeholder, or shimmer animation was detectable from the static CSS. Real implementations need loading states for the feed, avatar images, and async data.
- **Form validation states:** Beyond `{component.search-input-focus}`, there is no documentation for error states, disabled inputs, or success confirmation styling on form elements.
- **Dark mode palette:** The `{colors.surface-dark}` (#232525) and `{colors.on-dark}` (#ffffff) tokens exist but no dark mode toggle, class strategy, or inverted-component specifications were extractable from this light-mode screenshot.
- **Authenticated-user view:** The entire captured interface assumes logged-out or minimal-auth state (prominent "Log in or sign up" card). Dashboard views, writer analytics surfaces, and subscription management UI are completely unknown.
- **Notification badge styling:** The Activity bell icon likely supports unread count badges, but no badge component, dot-indicator, or count-bubble styling was present in the extracted DOM.
- **Dropdown and menu panels:** The "For you ▾" trigger implies a filter dropdown, and the "..." overflow menus imply popover panels, but neither panel's internal structure, positioning logic, or option styling was visible.
- **Keyboard navigation focus rings:** Focus-visible outlines for accessibility were not explicitly styled in the extracted CSS — implementation should add custom focus rings (likely 2px `{colors.primary}` offset outline) for keyboard users.
- **Mobile-specific components:** Bottom tab bar, hamburger drawer, swipe gestures for archive navigation, and pull-to-refresh behaviors are entirely absent from the desktop-only capture.
- **Pixel-exact hero illustration dimensions and positioning:** The pen/notebook artwork coordinates, whether it's an `<img>`, CSS background, or SVG, and how it responsively crops, could not be precisely determined from style extraction alone.