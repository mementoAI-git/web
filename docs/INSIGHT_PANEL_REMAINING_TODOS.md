# Insight panel — remaining work

Checklist for follow-ups after narrative **Insights**, **At a glance**, and `GET /users/stats` spotlight.

## Documentation

- [ ] Update [MEMENTO_ENRICHMENT_SCORE.md](./MEMENTO_ENRICHMENT_SCORE.md): document `spotlight`, **Insights** vs **At a glance**, and links to [`narrative-insights.tsx`](../src/features/enrichment/narrative-insights.tsx) + [`at-a-glance-cards.tsx`](../src/features/enrichment/at-a-glance-cards.tsx).
- [ ] Refresh project plan `insight_panel_design_2d405b90.plan.md` body (remove stale bullets; keep roadmap todos in frontmatter).

## Product / UX

- [ ] **Enrichment as “life story”** — replace or soften the raw **Breadth** progress bar with narrative copy (e.g. dimension-specific growth lines) where the model/API can support it safely.
- [ ] **Server-generated narratives** — optional `GET /users/insights` (or extend stats) returning curated lines + provenance arrays (memories, chat summaries, journals, quick capture) so client heuristics are not the only source.
- [ ] **Dismiss / snooze** — optional control on the modal hero so it never feels like a nag (local or per-user preference).
- [ ] **Host chat enrichment bar** — replace stub with real `GET /users/stats` (see MEMENTO_ENRICHMENT_SCORE §4.2).
- [ ] **Spotlight fallbacks** — when no qualifying memory: title-only, pending quick-capture, or explicit empty state (product + privacy).
- [ ] **Optional:** URL or state to pass jump-pill text into host chat (today: copy + “Open host chat”).
- [ ] **Optional:** feature-flag the modal layout for gradual rollout.

## Ops

- [ ] **Deploy order** — ship API with `spotlight` before or with web; web tolerates missing `spotlight`.

## Done in-tree (reference)

- [x] **Insights** — narrative cards with **View** + **Sources** (client-built from spotlight, nudge, dimension mirror) via [`narrative-insights.tsx`](../src/features/enrichment/narrative-insights.tsx).
- [x] **At a glance** — renamed KPI strip ([`at-a-glance-cards.tsx`](../src/features/enrichment/at-a-glance-cards.tsx)) in Settings + Memory Insights modal.
- [x] Phase B **`spotlight`** on `GET /users/stats` + hero thread block.
