/**
 * Shared quick capture draft storage (plain quick capture + daily prompt variants).
 * Used by QuickCapture modal and Create memory so drafts stay consistent.
 */

export type DailyPromptCapturePayload = {
  pinned_text: string;
  prompt_type: "static" | "ai-generated";
  prompt_id?: string;
  reflection_day_key: string;
};

export type QuickCaptureDraftAttachment = {
  clientId: string;
  _id: string;
  url?: string;
  name?: string;
  type?: string;
  kind?: "voice" | "file";
  durationSec?: number;
};

export type QuickCaptureDraft = {
  note?: string;
  selectedBeneficiaryIds?: string[];
  selectedGroupIds?: string[];
  visibility?: "private" | "everyone";
  daily_prompt?: DailyPromptCapturePayload;
  attachments?: QuickCaptureDraftAttachment[];
};

export const QUICK_CAPTURE_DRAFT_PREFIX = "quick-capture-draft:";

export function quickCaptureDraftSimpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export function quickCaptureDraftStorageKey(
  userEmail: string | undefined,
  daily: DailyPromptCapturePayload | undefined,
): string {
  const base = `${QUICK_CAPTURE_DRAFT_PREFIX}${userEmail || "anon"}`;
  if (!daily) return base;
  const slug = daily.prompt_id || `ai-${quickCaptureDraftSimpleHash(daily.pinned_text)}`;
  return `${base}:dp:${slug}`;
}

export function scanQuickCaptureDraftKeys(userEmail: string | undefined): string[] {
  const prefix = `${QUICK_CAPTURE_DRAFT_PREFIX}${userEmail || "anon"}`;
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
  } catch {
    /* ignore */
  }
  return keys.sort();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function looksLikeHtml(note: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(note);
}

export function plainTextFromQuickCaptureNote(note: string): string {
  if (!note) return "";
  if (!looksLikeHtml(note)) return note;

  return note
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/(h1|h2|h3|h4|blockquote|li)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Same as QuickCapture `buildBody`: plain note → TipTap-friendly HTML paragraphs. */
export function htmlFromQuickCaptureNote(note: string): string {
  if (!note.trim()) return "";
  if (looksLikeHtml(note)) return note;
  return note
    .trim()
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export function parseQuickCaptureDraftJson(raw: string): QuickCaptureDraft | null {
  try {
    return JSON.parse(raw) as QuickCaptureDraft;
  } catch {
    return null;
  }
}

export function quickCaptureDraftPreviewLine(draft: QuickCaptureDraft): string {
  const fromNote = plainTextFromQuickCaptureNote(draft.note || "").trim().slice(0, 72);
  if (fromNote) return fromNote;
  if (draft.daily_prompt?.pinned_text?.trim()) {
    return draft.daily_prompt.pinned_text.trim().slice(0, 72);
  }
  return "(empty note)";
}

export function quickCaptureDraftKindLabel(storageKey: string): string {
  if (storageKey.includes(":dp:")) return "Daily prompt";
  return "Quick capture";
}
