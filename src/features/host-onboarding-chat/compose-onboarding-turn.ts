/**
 * Intent-first composer for host onboarding chat (Phase A).
 * Picks reflection + question variants and a chip subset deterministically from thread context.
 */
import type { HostOnboardingExchangeIndex, HostOnboardingMessage } from "./types";

export const TOTAL_EXCHANGES = 6 as const;

export interface OnboardingComposeContext {
  messages: HostOnboardingMessage[];
  exchangeIndex: HostOnboardingExchangeIndex;
  nickname: string;
  /** Fixed seed for stable tests (defaults to hash of thread + index + nickname). */
  variantSeed?: number;
}

export interface ComposedOnboardingTurn {
  intentId: string;
  /** Machine-oriented summary for future API / analytics */
  collects: string;
  assistantText: string;
  suggestionChips: string[];
  composerPlaceholder: string;
  composerLabel: string;
}

function hashThread(
  messages: HostOnboardingMessage[],
  nickname: string,
  exchangeIndex: number
): number {
  let h = 2166136261;
  const str = `${nickname}|${exchangeIndex}|${messages.map((m) => `${m.role}:${m.content}`).join("|")}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function mulberry() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function shuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = [...arr];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** PRD-style 5–8 visible chips from a pool. */
export function pickChipSubset(
  pool: readonly string[],
  seed: number,
  min = 5,
  max = 8
): string[] {
  if (pool.length <= min) return [...pool];
  const shuffled = shuffle(pool, seed);
  const rnd = mulberry32(seed ^ 0xbeefcafe);
  const count = Math.min(
    pool.length,
    min + Math.floor(rnd() * (max - min + 1))
  );
  return shuffled.slice(0, count);
}

function joinTurn(reflection: string, question: string): string {
  const r = reflection.trim();
  const q = question.trim();
  if (!r) return q;
  return `${r}\n\n${q}`;
}

/** Canonical default (legacy tests / persistence substring “age bracket”). */
export const DEFAULT_EXCHANGE_0_QUESTION =
  "If you're comfortable sharing, what's your age bracket and where are you based? City, region, or country is enough, and you can skip either.";

const EXCHANGE_0_QUESTION_VARIANTS = [
  DEFAULT_EXCHANGE_0_QUESTION,
  "Mind sharing roughly your age bracket and where you’re based? City or country is fine—you can skip either.",
  "Quick one: age bracket and rough location (city, region, or country)? Totally optional either way.",
] as const;

const EXCHANGE_0_AGE_CHIPS = [
  "Under 25",
  "25-39",
  "40-54",
  "55-69",
  "70+",
  "Prefer not to say",
] as const;

const EXCHANGE_0_PLACE_CHIPS = [
  "Big city",
  "Town or village",
  "Rural",
  "Often in two places",
  "Prefer not to say place",
] as const;

const EX0_PLACEHOLDERS = [
  "e.g. 40s, Yorkshire",
  "e.g. late 30s, American Midwest",
  "e.g. prefer not to say place",
] as const;

/** Exchange 0 follow-up (age / place) after intro ack. */
export function composeExchange0Followup(
  ctx: OnboardingComposeContext
): ComposedOnboardingTurn {
  const seed =
    ctx.variantSeed ?? hashThread(ctx.messages, ctx.nickname, ctx.exchangeIndex);
  const assistantText = pickOne(EXCHANGE_0_QUESTION_VARIANTS, seed);
  const placePick = pickChipSubset(
    EXCHANGE_0_PLACE_CHIPS,
    seed ^ 0x51eed,
    2,
    4
  );
  return {
    intentId: "ex2_age_place",
    collects: "age_bracket, location",
    assistantText,
    suggestionChips: [...EXCHANGE_0_AGE_CHIPS, ...placePick],
    composerPlaceholder: pickOne(EX0_PLACEHOLDERS, seed >>> 3),
    composerLabel: "Age and location (optional)",
  };
}

const EX1 = {
  intentId: "ex3_self_intro",
  collects: "occupation, work_identity, hobbies facet",
  reflections: [
    "Yeah, that helps.",
    "Got it.",
    "Makes sense.",
    "Fair.",
  ],
  questions: [
    "When someone asks what you do—or what fills your days—what do you usually say? Work, care, study, hobbies, all fair game.",
    "How do you usually describe yourself if someone asks what you’re up to these days—paid work, care, study, side projects, hobbies?",
    "What’s the honest answer you give when people ask what you do or how you spend your time?",
  ],
  chipPool: [
    "Still working",
    "Retired",
    "Studying",
    "Caregiving",
    "Between roles",
    "Making / craft",
    "Sport or fitness",
    "Music or singing",
    "Volunteering",
    "Prefer not to say",
  ],
  placeholders: [
    "e.g. nurse, full-time dad, retired, choir and grandkids",
    "e.g. freelance, two kids, pottery on Thursdays",
  ],
  composerLabel: "How you introduce yourself",
} as const;

const EX2 = {
  intentId: "ex4_pulls_you",
  collects: "interests[], intellectual_style",
  reflections: ["Got it.", "Nice.", "Yeah.", "Cool."],
  questions: [
    "When you’ve got spare attention, what pulls you in—topics, hobbies, rabbit holes?",
    "What could you happily stay with for ages when you get a bit of free headspace?",
    "What tends to grab your curiosity when you’re not in full-on task mode?",
  ],
  chipPool: [
    "Family stories",
    "Food & cooking",
    "Travel",
    "Nature & outdoors",
    "Books & ideas",
    "Faith & community",
    "History & ancestry",
    "Games & puzzles",
    "Making & fixing",
    "Science & how things work",
  ],
  placeholders: [
    "e.g. local history, Sunday cricket",
    "e.g. genealogy, baking, long walks",
  ],
  composerLabel: "What pulls you in",
} as const;

const EX3 = {
  intentId: "ex5_personality",
  collects: "personality_sketch, thinking style",
  reflections: [
    "Here’s a read: thoughtful, a bit curious—someone who notices the practical stuff and the small good bits.",
    "You come across as grounded and a little curious—someone who clocks both the plan and the texture of a day.",
    "I’m getting thoughtful and observant—practical, but you notice the small stuff too.",
  ],
  questions: [
    "Close, or what would you tweak?",
    "Does that land, or what’s off?",
    "Fair mirror—or what should we adjust?",
  ],
  chipPool: [
    "Sounds about right",
    "Softer than that",
    "More direct",
    "You missed something",
    "A bit more playful",
    "Quieter than that sounds",
  ],
  placeholders: [
    "e.g. I'm quieter with strangers than that sounds",
    "e.g. sharper with close friends",
  ],
  composerLabel: "Adjust how we read you",
} as const;

const EX4 = {
  intentId: "ex6_who_matters",
  collects: "intended_audience",
  reflections: ["Cool.", "Thanks.", "Got it.", "Yeah."],
  questions: [
    "Who’s at the heart of the memories you want here? Rough roles are fine—no full names needed.",
    "When you picture what you’re keeping here, who’s most central? Roles are enough.",
    "Whose stories are you mainly holding or passing on in this space?",
  ],
  chipPool: [
    "My children",
    "My parents",
    "My partner",
    "Mostly me / my own story",
    "Extended family",
    "Honouring someone who died",
    "A few people equally",
    "It's a mix",
    "My community",
  ],
  placeholders: [
    "e.g. my teenagers, Dad, me and my sister",
    "e.g. mostly me and my partner",
  ],
  composerLabel: "Who your memories orbit",
} as const;

const EX5 = {
  intentId: "ex7_confirm",
  collects: "summary, introduction seed, completion",
  reflections: [""],
  questions: [
    "Here’s the snapshot:\n\n• What we call you / where you’re based\n• How you spend your days and what pulls you in\n• Who your stories orbit\n• A rough take on how you come across\n\nSound right? Anything to add before we save?",
    "Quick recap:\n\n• Name / rough location\n• How you spend your days & what pulls you in\n• Who your memories orbit\n• A first pass on your vibe\n\nFeel accurate? Anything to tweak before we save?",
  ],
  chipPool: [
    "Yes, save it",
    "One small fix",
    "Shorter summary",
    "Warmer tone",
    "More factual",
  ],
  placeholders: [
    "Anything missing? Faith, culture, a cause you care about",
    "e.g. add that I’m big on community",
  ],
  composerLabel: "Final tweaks",
} as const;

const EXCHANGE_DEFS = [EX1, EX2, EX3, EX4, EX5] as const;

/**
 * Compose assistant turn + composer chrome for exchanges 1–5 (post age/place).
 */
export function composeOnboardingTurn(
  ctx: OnboardingComposeContext
): ComposedOnboardingTurn {
  const { exchangeIndex } = ctx;
  if (exchangeIndex === 0) {
    return composeExchange0Followup(ctx);
  }

  const def = EXCHANGE_DEFS[exchangeIndex - 1];
  if (!def) {
    throw new Error(`No compose def for exchange ${exchangeIndex}`);
  }

  const seed =
    ctx.variantSeed ?? hashThread(ctx.messages, ctx.nickname, exchangeIndex);
  const reflection = pickOne(def.reflections, seed);
  const question = pickOne(def.questions, seed * 0x9e3779b1);
  const assistantText = joinTurn(reflection, question);

  return {
    intentId: def.intentId,
    collects: def.collects,
    assistantText,
    suggestionChips: pickChipSubset(def.chipPool, seed ^ 0xdead, 5, 8),
    composerPlaceholder: pickOne(def.placeholders, seed >>> 5),
    composerLabel: def.composerLabel,
  };
}
