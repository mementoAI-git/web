import type { OnboardQuestionsStep } from "./useOnboardQuestionsState";

/** Short hint (always visible) + longer “Why?” copy for trust. */
export const ONBOARD_MISC_WHY: Record<
  Exclude<OnboardQuestionsStep, 6 | 12>,
  { hint: string; detail: string }
> = {
  1: {
    hint: "This sets the tone of your Memento experience.",
    detail:
      "We use this to match how we talk with you—never to judge you. Pick what feels closest; you can refine it later.",
  },
  2: {
    hint: "This helps us contextualize your memories within the era you lived them.",
    detail:
      "Age ranges help us suggest the right kind of prompts and pacing. You can choose “I’d rather not say” anytime.",
  },
  3: {
    hint: "Understanding your day-to-day helps us meet you where you are.",
    detail:
      "Work context shapes how we phrase questions—so they feel relevant, not generic.",
  },
  4: {
    hint: "“Home” can be a place, a feeling, or the people around you.",
    detail:
      "We ask in a narrative way so it feels human—not like a form. Your words stay yours.",
  },
  5: {
    hint: "A light snapshot of how people experience you—not a personality test.",
    detail:
      "Pick up to two vibes. This nudges tone and warmth in chat—nothing is set in stone.",
  },
  7: {
    hint: "The small and big moments that make life feel lived.",
    detail:
      "This helps us suggest memory prompts that feel meaningful to you—not random icebreakers.",
  },
  8: {
    hint: "What you reach for when you have free time.",
    detail:
      "Interests guide gentle suggestions inside Memento. We never use them for public marketing copy.",
  },
  9: {
    hint: "We use this to time reflection prompts so they don’t interrupt your flow.",
    detail:
      "When notifications exist for your account, we’ll aim for the part of the day that fits you best.",
  },
  10: {
    hint: "Not a legal setting—just what feels true today.",
    detail:
      "Sharing controls stay in your hands in the product. This is an early intent check so Memento feels aligned.",
  },
  11: {
    hint: "You can change this anytime.",
    detail:
      "Pick up to two areas to lean into first. Everything else stays as gentle invitations—not a checklist of failure.",
  },
};
