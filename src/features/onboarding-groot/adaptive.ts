/**
 * Host Onboarding (Groot) — Adaptive closing copy and primary CTA
 * @see memento-onboarding-prd.md §6
 */

import type { ExpressionMode, MotivationType } from "./types";

export interface CTAConfig {
  label: string;
  action:
    | "voice_recorder"
    | "reflection_prompt"
    | "file_upload"
    | "dashboard";
}

export interface Step5BodyOptions {
  /** User exited after hook phase (“Continue later”). */
  partialPersonalization?: boolean;
}

/**
 * Step 4 headline — adaptive based on motivationType (Groot flow).
 */
export function getStep4Headline(motivation: MotivationType | null): string {
  if (!motivation) return "What feels most like you?";
  switch (motivation) {
    case "emotional_depth":
    case "external":
      return "How do you most naturally open up?";
    case "memory_preservation":
    case "practical":
      return "How would you most like to add to your Memento?";
    case "self_understanding":
    case "personal_space":
      return "What feels most like you?";
    case "explorer":
    default:
      return "What feels most like you?";
  }
}

/**
 * Closing body copy — adaptive based on motivationType.
 */
export function getStep5Body(
  motivation: MotivationType | null,
  options?: Step5BodyOptions,
): string {
  if (options?.partialPersonalization) {
    return "You've made a solid start. Whenever you're ready, we can go deeper together.";
  }
  if (!motivation) {
    return "No pressure — take a look around and start wherever feels right.";
  }
  switch (motivation) {
    case "self_understanding":
      return "Take your time. This space is yours to discover yourself in.";
    case "personal_space":
      return "Make yourself at home. Add whatever you want, however you want.";
    case "emotional_depth":
      return "Start with something that matters to you — even a small memory is the beginning of something lasting.";
    case "memory_preservation":
      return "Your memories are safe here. Let's capture the first one right now.";
    case "external":
      return "Whoever asked you to do this — they'll be glad you did. Let's make a start.";
    case "practical":
      return "Everything in its place. Let's set up your first piece of your Memento.";
    case "explorer":
    default:
      return "No pressure — take a look around and start wherever feels right.";
  }
}

/**
 * Primary CTA after onboarding.
 * When `modes` is non-empty (Groot flow), legacy motivation × expression rules apply.
 * When `modes` is empty (`/onboarding/misc`), CTA is derived from motivation only.
 */
export function getPrimaryCTA(
  motivation: MotivationType | null,
  modes: ExpressionMode[] = [],
): CTAConfig {
  if (!motivation) {
    return { label: "Go to dashboard", action: "dashboard" };
  }

  const hasVoice = modes.includes("voice");
  const hasWriting = modes.includes("writing");
  const hasMedia = modes.includes("media");
  const hasGuided = modes.includes("guided");

  if (modes.length > 0) {
    if (motivation === "explorer") {
      return { label: "Go to dashboard", action: "dashboard" };
    }
    if (motivation === "memory_preservation" && hasMedia) {
      return { label: "Upload something precious", action: "file_upload" };
    }
    if (hasVoice) {
      return { label: "Record your first memory", action: "voice_recorder" };
    }
    if (hasGuided || hasWriting) {
      return { label: "Answer your first prompt", action: "reflection_prompt" };
    }
    if (hasMedia) {
      return { label: "Upload something precious", action: "file_upload" };
    }
    return { label: "Go to dashboard", action: "dashboard" };
  }

  switch (motivation) {
    case "self_understanding":
    case "personal_space":
      return { label: "Open your space", action: "dashboard" };
    case "memory_preservation":
    case "emotional_depth":
      return { label: "Record your first memory", action: "voice_recorder" };
    case "explorer":
    case "external":
    default:
      return { label: "Go to dashboard", action: "dashboard" };
  }
}
