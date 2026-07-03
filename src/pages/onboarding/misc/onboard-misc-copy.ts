import type { OnboardQuestionsStep } from "./useOnboardQuestionsState";

/** Short hint (optional) + concise “Why?” copy for trust. */
export const ONBOARD_MISC_WHY: Record<
  Exclude<OnboardQuestionsStep, 6 | 12>,
  { hint: string; detail: string }
> = {
  1: {
    hint: "This sets the tone of your Memento experience.",
    detail:
      "This helps Memento understand what you want from the experience. Pick what feels closest. You can refine it later.",
  },
  2: {
    hint: "This helps us contextualize your memories within the era you lived them.",
    detail:
      "This helps us suggest the right pace and kinds of prompts for you. You can always choose I'd rather not say.",
  },
  3: {
    hint: "Understanding your day-to-day helps us meet you where you are.",
    detail:
      "This gives Memento a little context for your day to day life so its questions feel relevant.",
  },
  4: {
    hint: "“Home” can be a place, a feeling, or the people around you.",
    detail:
      "Home can mean a place, a feeling, or the people around you. Your answer stays in your own words.",
  },
  5: {
    hint: "A light snapshot of how people experience you—not a personality test.",
    detail:
      "This gives Memento a light sense of your personality so its tone feels warmer and more natural.",
  },
  7: {
    hint: "The small and big moments that make life feel lived.",
    detail:
      "This helps Memento suggest prompts that feel meaningful to you instead of random.",
  },
  8: {
    hint: "What you reach for when you have free time.",
    detail:
      "Your interests help shape gentle suggestions and prompts inside Memento.",
  },
  9: {
    hint: "We use this to time reflection prompts so they don’t interrupt your flow.",
    detail:
      "This helps us understand when reflection might feel most natural for you.",
  },
  10: {
    hint: "Not a legal setting—just what feels true today.",
    detail:
      "This is just an early signal about how private or shared you want Memento to feel today.",
  },
  11: {
    hint: "You can change this anytime.",
    detail:
      "This helps Memento know where to start first. You can always change it later.",
  },
};
