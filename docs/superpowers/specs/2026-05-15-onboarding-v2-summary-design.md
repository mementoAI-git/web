# Onboarding V2 Summary Design

Date: 2026-05-15
Scope: `memento-web` preview route `onboarding-v2/summary`
Status: Draft for review

## Goal

Design a preview version of the onboarding summary page that feels calmer, more minimal, and more editorial than the current implementation while preserving the existing summary logic, enrichment score, and action behavior.

This page should feel like a private first chapter of the user's Memento rather than a completion dashboard.

## Users

People finishing onboarding who should feel:

- safe
- unhurried
- gently encouraged to continue

The page should reduce the sense of product ceremony and increase the sense of thoughtful personal reflection.

## Design Direction

Reference direction: sparse editorial layout with a quiet left rail and a scrollable content column on the right.

Core qualities:

- restrained
- spacious
- typographically led
- low chrome
- emotionally calm

This is not a stats page, even though it contains metrics. It is a reflective summary page with product clarity underneath it.

## Information Architecture

### Left Rail

Purpose:
Provide a quiet, low-pressure escape hatch and a small framing note without competing with the main content.

Content:

- small label such as `First reflection`
- one short supporting line such as `A private place to begin`
- one understated button: `Go to dashboard`

Behavior:

- remains visually sparse
- on desktop, sits as a narrow column to the left
- on tablet and mobile, moves above the main content and becomes a compact intro block

### Right Content Column

Purpose:
Hold the actual summary experience in a vertically scrollable editorial flow.

Content order:

1. Opening statement
2. Soft enrichment framing
3. First themes already touched
4. What happens next
5. Primary continuation action

Behavior:

- vertically scrollable if content exceeds viewport height
- should feel like reading a composed page, not scanning a dashboard grid

## Content Translation

### 1. Opening Statement

Use a large serif heading with a calm, affirming sentence.

Examples of tone:

- `You have already started shaping the story only you can tell.`
- `A first outline of your Memento is already here.`

Requirements:

- no celebratory badge language like `Great start`
- no KPI-first framing
- heading should feel reflective, not transactional

### 2. Enrichment Score Framing

Keep the real enrichment value, but present it as quiet context.

Preferred pattern:

- short paragraph near the heading:
  `You have already filled in 24% of your Memento just by introducing yourself.`

Optional supporting note:

- `The rest can unfold slowly, in your own time.`

Requirements:

- avoid oversized dashboard metric treatment
- if a larger numeral is shown, it should feel secondary to the editorial narrative
- the number should support the emotional arc, not dominate it

### 3. Themes Already Touched

Do not render the current territory map as a loud utility grid.

Instead:

- surface a more curated presentation of touched categories first
- present them as 3-5 quiet editorial tiles, strips, or structured notes
- use lighter categories lower in the page only if needed

Suggested translation:

- heading: `What has already begun`
- subtext: `These are the parts of your story that have already started to take shape.`

Each touched category should feel like:

- a chapter heading
- a note in a keepsake
- a gentle signal, not a status chip

For untouched categories:

- avoid equal visual weight with touched categories
- lower them into a quieter secondary section or sentence:
  `Other parts of your story can wait until you are ready.`

### 4. What Happens Next

This section should bridge reflection into action.

Heading examples:

- `Where you can go from here`
- `You can keep going softly from here`

Two ideas should be communicated:

- talking with Memento offers a gentle next step
- continuing to the app is valid and low pressure

This section should make the user feel invited, not pushed.

### 5. Actions

Action hierarchy:

- primary: `Talk with Memento`
- secondary: `Go to dashboard`

Placement:

- `Go to dashboard` lives under the left-rail text
- `Talk with Memento` lives at the bottom of the main right-hand content

Rationale:

- left side becomes the quiet exit
- right side becomes the deeper continuation

Styling:

- dashboard button should be understated, likely outline or ghost
- host chat button should be the clearest CTA, but still refined and calm

## Layout Specification

### Desktop

Structure:

- two-column layout
- left rail: narrow fixed-width column
- right column: wider editorial column

Behavior:

- left rail remains visible and quiet
- right side may scroll independently if necessary

Spacing:

- generous vertical rhythm
- large separation between sections
- avoid stacking card-on-card containers

### Tablet

Structure:

- still two sections, but more compressed
- left rail may move above the right column if width becomes constrained

Behavior:

- preserve breathing room
- avoid tiny two-column subgrids for touched categories if they feel cramped

### Mobile

Structure:

- single-column stack
- left-rail content becomes a compact intro section at the top
- dashboard button appears directly beneath the intro text
- main summary content follows in order

Behavior:

- no horizontal compression of editorial content
- touched themes become a vertical stack
- primary CTA remains at the bottom of the content column

Requirements:

- text must wrap naturally
- headings must remain elegant without crowding
- no overlap between sections, buttons, or labels

## Motion Direction

Motion should be subtle and nearly invisible in intent.

Allowed motion:

- soft fade with slight upward translation on section entry
- short stagger between major sections
- gentle press feedback on buttons

Recommended values:

- entrance: opacity + `translateY(6px)`
- duration: 160-240ms
- easing: strong ease-out
- button press: `scale(0.97)`

Avoid:

- bounce
- elastic motion
- overscaled entrances
- anything that feels celebratory or app-marketing-like

Reduced motion:

- preserve opacity transitions only where useful
- remove meaningful movement when `prefers-reduced-motion` is enabled

## Visual Rules

Use the existing V3 design system.

Design constraints:

- warm neutrals
- soft contrast
- minimal borders
- typography carries hierarchy more than containers do
- avoid turning every content block into a card

Do:

- rely on whitespace
- use serif display type for emotional weight
- keep button styles tactile but quiet
- use subtle separators where sections need structure

Do not:

- make this feel like a dashboard
- let the enrichment score dominate the page
- give touched and untouched states equal visual loudness
- introduce decorative effects that fight the calm tone

## Accessibility

Requirements:

- WCAG AA contrast minimum
- keyboard-accessible actions
- clear heading hierarchy
- screen-reader-friendly section ordering
- reduced motion support

## Data and Behavior

This preview must reuse the current live logic:

- same summary snapshot source
- same enrichment score source from `GET /users/stats`
- same next-action resolution
- same host-chat starter behavior

Only the presentation layer changes.

## Out of Scope

Not included in this design:

- redesigning `misc`
- changing onboarding API behavior
- altering summary logic or destination logic
- changing copy across the rest of onboarding

## Acceptance Criteria

The preview is successful if:

- it clearly feels calmer and more minimal than the current summary page
- it still communicates the enrichment score and touched themes
- the action hierarchy is obvious without feeling pushy
- the left rail works as a quiet escape on desktop and a compact intro on mobile
- the layout remains clean on mobile and tablet
- the page feels editorial and reflective rather than dashboard-like
