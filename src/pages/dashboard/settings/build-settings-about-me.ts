import type { IUser, IUserPreferences } from "@/utility/interface";
import {
  DIMENSION_OPTIONS,
  MOTIVATION_OPTIONS,
  PASSION_OPTIONS,
} from "@/features/onboarding-groot/types";

const PASSION_BY_VALUE = new Map(PASSION_OPTIONS.map((o) => [o.value, o.label]));
const DIMENSION_BY_VALUE = new Map(DIMENSION_OPTIONS.map((o) => [o.value, o.label]));

const TONE_LABELS: Record<string, string> = {
  upbeat: "an upbeat, energetic",
  calm: "a calm, reflective",
  analytical: "a thoughtful, analytical",
  creative: "a creative, expressive",
};

const STYLE_LABELS: Record<string, string> = {
  formal: "fairly formal",
  casual: "relaxed and casual",
  friendly: "warm and friendly",
  professional: "clear and professional",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "brief",
  medium: "medium-length",
  long: "more detailed",
};

const MAX_PARAGRAPHS = 3;

function formatOxfordList(parts: string[]): string {
  const p = parts.filter(Boolean);
  if (p.length === 0) return "";
  if (p.length === 1) return p[0]!;
  if (p.length === 2) return `${p[0]} and ${p[1]}`;
  return `${p.slice(0, -1).join(", ")}, and ${p[p.length - 1]}`;
}

function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** First-person paragraph: interests and how I described myself in onboarding. */
function paragraphInterests(raw: string): string {
  const tokens = splitCsv(raw);
  if (tokens.length === 0) return raw.trim();
  const mapped = tokens.map((t) => PASSION_BY_VALUE.get(t) ?? t);
  const allKeys = tokens.every((t) => PASSION_BY_VALUE.has(t));
  if (allKeys && mapped.length) {
    return `I'm especially curious about ${formatOxfordList(mapped)}, and those interests shape what I want Memento to hold onto for me.`;
  }
  return `When I went through onboarding, I shared that ${raw.trim()}.`;
}

/** First-person paragraph: story priorities (dimensions). */
function paragraphPriorities(raw: string): string {
  const tokens = splitCsv(raw);
  if (tokens.length === 0) return "";
  const mapped = tokens.map((t) => DIMENSION_BY_VALUE.get(t) ?? t);
  const allKeys = tokens.every((t) => DIMENSION_BY_VALUE.has(t));
  const core = allKeys ? formatOxfordList(mapped) : raw.trim();
  return `The parts of my story I'm prioritizing right now include ${core}.`;
}

function sentenceMotivations(reasons: string[]): string | null {
  if (!reasons.length) return null;
  const labels = reasons
    .map((r) => MOTIVATION_OPTIONS.find((o) => o.value === r)?.label ?? r.trim())
    .filter(Boolean);
  if (!labels.length) return null;
  return `What brought me to Memento comes down to this: ${formatOxfordList(labels)}.`;
}

function paragraphPreferencesAndGoals(
  prefs: IUserPreferences | undefined,
  goals: string[] | undefined,
): string | null {
  const bits: string[] = [];

  if (prefs) {
    const tone = prefs.conversation_tone ? TONE_LABELS[prefs.conversation_tone] ?? prefs.conversation_tone : null;
    const style = prefs.communication_style
      ? STYLE_LABELS[prefs.communication_style] ?? prefs.communication_style
      : null;
    const len = prefs.response_length ? LENGTH_LABELS[prefs.response_length] ?? prefs.response_length : null;
    const prefBits = [
      tone && `${tone} conversational tone`,
      style && `${style} phrasing`,
      len && `${len} replies`,
    ].filter(Boolean) as string[];
    if (prefBits.length) {
      bits.push(`I tend to prefer ${formatOxfordList(prefBits)} when I'm capturing memories here.`);
    }
    const topics = prefs.topics_of_interest?.map((t) => t.replace(/_/g, " ")).filter(Boolean) ?? [];
    if (topics.length) {
      bits.push(`Topics I especially care about include ${formatOxfordList(topics)}.`);
    }
  }

  if (goals?.length) {
    bits.push(`Goals I'm holding onto include ${formatOxfordList(goals)}.`);
  }

  if (!bits.length) return null;
  return bits.join(" ");
}

function hasOnboardingSignals(user: IUser): boolean {
  const ctx = user.context;
  const prefs = user.preferences;
  return !!(
    ctx?.self_description?.trim() ||
    (typeof ctx?.current_priority === "string" && ctx.current_priority.trim()) ||
    ctx?.join_reasons?.some((r) => String(r).trim()) ||
    prefs?.topics_of_interest?.length ||
    prefs?.communication_style ||
    prefs?.conversation_tone ||
    prefs?.response_length ||
    ctx?.goals_and_aspirations?.length
  );
}

/**
 * Up to three first-person paragraphs from onboarding-backed profile fields
 * (interests, priorities & motivation, preferences & goals).
 */
export function buildSettingsAboutMeParagraphs(user: IUser | null | undefined): string[] | null {
  if (!user?.context || !hasOnboardingSignals(user)) return null;

  const ctx = user.context;
  const paragraphs: string[] = [];

  const sd = ctx.self_description?.trim();
  if (sd) paragraphs.push(paragraphInterests(sd));

  const cp = typeof ctx.current_priority === "string" ? ctx.current_priority.trim() : "";
  const motivations = (ctx.join_reasons ?? []).map((r) => String(r).trim()).filter(Boolean);
  const p2Parts: string[] = [];
  if (cp) {
    const pr = paragraphPriorities(cp);
    if (pr) p2Parts.push(pr);
  }
  const mot = sentenceMotivations(motivations);
  if (mot) p2Parts.push(mot);
  if (p2Parts.length) paragraphs.push(p2Parts.join(" "));

  const p3 = paragraphPreferencesAndGoals(user.preferences, ctx.goals_and_aspirations);
  if (p3) paragraphs.push(p3);

  const trimmed = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!trimmed.length) return null;
  return trimmed.slice(0, MAX_PARAGRAPHS);
}
