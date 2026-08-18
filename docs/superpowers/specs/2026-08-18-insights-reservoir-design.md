# Insights Reservoir Design

## Goal

Turn Memory Insights into a useful, member-owned account reservoir. It must distinguish durable knowledge Memento has learned from optional prompts for new reflection, with transparent provenance and natural member-facing language.

## Information architecture

The Memory Insights modal has two independent sections, in this order:

1. **What Memento remembers**: durable, reviewable observations about the member.
2. **Explore next**: optional reflection prompts for adding new material.

The existing snapshot hero may remain, but neither section depends on it. Activity KPIs remain separate from both sections and are not presented as insights.

## What Memento remembers

This is the account reservoir. It presents durable observations grouped by one of the ten Enrichment Categories when metadata exists. An observation is a member-owned record, never an opaque AI conclusion.

Each card contains:

- a second-person observation, for example: “You value quiet Sundays.”
- its life-dimension label when present;
- provenance, for example: “Based on 3 memories”; and
- a primary **Review** action.

Review opens the full record with source memories/conversations. The member can open each source, edit the observation, or remove it from their profile. Edit and removal change only that observation; source memories remain intact.

When category or source metadata is unavailable, render the observation plainly. Do not infer a dimension, source count, or confidence from incomplete data.

## Explore next

This section contains at most two optional prompts. They are prompts to create new material, not statements of account knowledge.

Each prompt contains a concise reason it was surfaced and one primary **Reflect in chat** action. The action opens Host Chat with the prompt prefilled. A **Dismiss** action hides only the prompt and does not modify any saved observation, source memory, or score.

## Voice

Member-facing insight copy uses second person by default: “You value quiet Sundays.”

Nickname, then first name, may be used sparingly for headings, direct invitations, or high-emphasis moments: “Maya, this appears in three memories.” Names are not the default sentence subject.

Never expose internal third-person language such as “the user,” “the member,” or “the host.”

The client normalizes older stored observations before rendering. The extraction/generation path receives the member’s preferred identity and instructions to produce member-facing second-person observations, so new records are correct at creation.

## Data contract

The reservoir needs an observation record rather than unstructured Persona arrays alone:

- stable observation ID;
- content;
- optional enrichment category;
- source references and source count;
- creation/update timestamps;
- review status; and
- support for editing and removal.

The API should be backward-compatible: records without category or provenance remain renderable as plain observations. The web client must not invent missing metadata.

## Failure and empty states

- No observations: explain that the reservoir will grow as memories are saved and conversations continue.
- No prompts: omit Explore next rather than adding filler.
- Missing sources: retain the observation but omit source links/counts.
- API failure: preserve other Insights content and show a contained retry/error state for the affected section.

## Verification

Tests cover second-person normalization (including legacy “the user” text), name fallback behavior, missing metadata, source review, edit/remove actions, chat prompt handoff, dismiss behavior, empty states, and API-error isolation.

## Scope

This work includes the web UI and the API changes required for observation metadata and generation voice. It excludes changes to enrichment scoring math, category weights, decay, and beneficiary access rules.
