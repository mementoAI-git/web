# Chat Settings Drawer — Second-Pass Design

## Goal

Bring the chat settings drawer closer to Figma while preserving its existing data, voice-preview, ambience, and navigation behavior.

## Approved decisions

- The drawer uses a solid `bg-background` surface. A decorative brand-tint gradient is layered over only the top 465px and never replaces the opaque base.
- The enrichment headline remains qualitative: `Strong`, `Medium`, or `Weak`.
- The enrichment bar is a truthful part-to-whole chart. Its ten segments follow the Life Area reference order and color identity: Memories & Experiences, Heritage & Roots, Lessons & Wisdom, Relationships & People, Beliefs & Worldview, Passions & Interests, Hopes & Legacy, Work & Purpose, Everyday Life, Identity & Self. Segment widths are normalized from the corresponding life-area scores; when all scores are zero or unavailable, all ten segments share the width equally.
- The life-area palette is defined as named design tokens in `src/index.css`, not as raw colors in component markup.
- Voice cards contain exactly an avatar, the voice name, and one metadata line formatted as `Gender · Voice type`. Provider/client/debug rows are not rendered.
- The ambience controller matches the Figma geometry: a 20px high neutral track, filled brand portion, and a slim white position marker rather than a circular thumb.
- Cards inside the drawer use a consistent `rounded-xl` radius, including enrichment, shortcuts, insights, voices, and ambience choices.

## Scope

Presentation-layer changes only. No API contracts, persistence behavior, audio playback logic, or routing behavior change.

## Verification

- Unit tests cover life-area order, score-proportional widths, fallback distribution, voice metadata shape, slider semantics/geometry, and solid drawer surface.
- Changed-file lint, variable checks, focused tests, full tests, production build, and browser screenshots validate the result.
