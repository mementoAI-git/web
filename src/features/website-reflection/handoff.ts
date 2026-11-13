/**
 * Website reflection handoff.
 *
 * The marketing site lets a visitor answer the hero's daily question before they have an account. Its "Continue to
 * the app" link opens /register with the reply in the query string:
 *   ?source=website-hero-reply&reflection_topic=…&reflection_question=…&reflection_answer=…
 * We keep it on this device (it survives sign-up, email verification and onboarding), remove it from the address
 * bar, and save it as a reflection once a signed-in user reaches the dashboard.
 */
const KEY = "memento:website-reflection";
const MAX_AGE = 14 * 24 * 60 * 60 * 1000;
export const QUESTION_MAX = 500;
export const ANSWER_MAX = 5000;
const PARAMS = ["source", "reflection_topic", "reflection_question", "reflection_answer"] as const;

export type WebsiteReflection = {
  question: string;
  answer: string;
  topic?: string;
  capturedAt: number;
  attempts: number;
};

function isValid(value: unknown): value is WebsiteReflection {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.question === "string" && v.question.trim().length > 0 && v.question.length <= QUESTION_MAX &&
    typeof v.answer === "string" && v.answer.trim().length > 0 && v.answer.length <= ANSWER_MAX &&
    (v.topic === undefined || typeof v.topic === "string") &&
    typeof v.capturedAt === "number" && typeof v.attempts === "number"
  );
}

/** Reads the handoff from the URL (if any), stores it, and strips it from the address bar. */
export function captureWebsiteReflection(location: Pick<Location, "search" | "pathname" | "hash"> = window.location) {
  const params = new URLSearchParams(location.search);
  if (params.get("source") !== "website-hero-reply") return;
  const question = (params.get("reflection_question") ?? "").trim();
  const answer = (params.get("reflection_answer") ?? "").trim();
  const topic = (params.get("reflection_topic") ?? "").trim() || undefined;
  const draft = { question, answer, topic, capturedAt: Date.now(), attempts: 0 };
  if (isValid(draft)) {
    try {
      localStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      /* Without storage the reply can't outlive sign-up; registration still works. */
    }
  }
  // The reply is personal: don't leave it in the address bar, history or anything that reads the URL later.
  PARAMS.forEach((name) => params.delete(name));
  const query = params.toString();
  try {
    window.history.replaceState(window.history.state, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  } catch {
    /* Non-browser environments. */
  }
}

export function getWebsiteReflection(): WebsiteReflection | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (isValid(value) && Date.now() - value.capturedAt >= 0 && Date.now() - value.capturedAt < MAX_AGE) return value;
    localStorage.removeItem(KEY);
  } catch {
    /* Ignore unavailable or invalid storage. */
  }
}

export function recordWebsiteReflectionAttempt() {
  const draft = getWebsiteReflection();
  if (!draft) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, attempts: draft.attempts + 1 }));
  } catch {
    /* Storage may be unavailable. */
  }
}

export function clearWebsiteReflection() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

/** The local calendar day the visitor answered on, as the API's YYYY-MM-DD reflection day. */
export function reflectionDayKey(time: number) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
