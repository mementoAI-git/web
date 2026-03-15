/**
 * Host Onboarding (Groot) — Adaptive logic for Steps 4 and 5
 * @see memento-onboarding-prd.md §6
 */

import type { ExpressionMode, MotivationType } from "./types";

export interface CTAConfig {
  label: string;
  action:
    | "voice_recorder"
    | "reflection_prompt"
    | "file_upload"
    | "time_capsule"
    | "dashboard";
}

/**
 * Step 4 headline — adaptive based on motivationType
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
    case "explorer":
    default:
      return "What feels most like you?";
  }
}

/**
 * Step 5 body copy — adaptive based on motivationType
 */
export function getStep5Body(motivation: MotivationType | null): string {
  if (!motivation) return "No pressure — take a look around and start wherever feels right.";
  switch (motivation) {
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
 * Step 5 primary CTA — adaptive based on motivationType × expressionMode
 */
export function getPrimaryCTA(
  motivation: MotivationType | null,
  modes: ExpressionMode[]
): CTAConfig {
  if (!motivation) {
    return { label: "Take me to my dashboard", action: "dashboard" };
  }

  const hasVoice = modes.includes("voice");
  const hasWriting = modes.includes("writing");
  const hasMedia = modes.includes("media");
  const hasGuided = modes.includes("guided");

  if (motivation === "practical") {
    return { label: "Create your first time capsule", action: "time_capsule" };
  }
  if (motivation === "explorer") {
    return { label: "Take me to my dashboard", action: "dashboard" };
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
  return { label: "Take me to my dashboard", action: "dashboard" };
}
