import endpoint from "./endpoint";
import { storageKeys } from "@/utility/constant";
import type { HostOnboardingMessage } from "@/features/host-onboarding-chat/types";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/**
 * Trailer appended after streamed assistant text (same idea as structured tail in host chat).
 * Backend should send this as the final bytes of the stream so visible copy stays clean.
 */
export const ONBOARDING_STREAM_TRAILER_MARK = "\n__MEMENTO_ONBOARDING__";

/** JSON object after {@link ONBOARDING_STREAM_TRAILER_MARK} (snake_case). */
export interface OnboardingStreamMeta {
  suggestion_chips?: string[];
  composer_placeholder?: string;
  composer_label?: string;
  flow_complete?: boolean;
  step_index?: number;
  total_steps?: number | null;
  intent_id?: string;
}

export function splitOnboardingStreamBody(full: string): {
  text: string;
  meta: OnboardingStreamMeta | null;
} {
  const marker = ONBOARDING_STREAM_TRAILER_MARK;
  const idx = full.lastIndexOf(marker);
  if (idx === -1) {
    return { text: full.trimEnd(), meta: null };
  }
  const text = full.slice(0, idx).trimEnd();
  try {
    const raw = full.slice(idx + marker.length).trim();
    const meta = JSON.parse(raw) as OnboardingStreamMeta;
    return {
      text,
      meta: meta && typeof meta === "object" ? meta : null,
    };
  } catch {
    return { text: full.trimEnd(), meta: null };
  }
}

/** Visible assistant text only (hides trailer if it has started streaming). */
export function visibleOnboardingStreamPrefix(accumulated: string): string {
  const marker = ONBOARDING_STREAM_TRAILER_MARK;
  const idx = accumulated.indexOf(marker);
  if (idx === -1) return accumulated;
  return accumulated.slice(0, idx);
}

export interface HostOnboardingStreamRequestBody {
  messages: Array<{ role: string; content: string }>;
  nickname: string;
  /**
   * When true and `messages` is empty, server returns the opening assistant message
   * (e.g. tests / skip-intro dev). Normal flow sends the user intro as the first message.
   */
  bootstrap?: boolean;
}

export function messagesForOnboardingApi(
  messages: HostOnboardingMessage[],
): HostOnboardingStreamRequestBody["messages"] {
  return messages.map(({ role, content }) => ({ role, content }));
}

export interface StreamHostOnboardingChatArgs {
  messages: HostOnboardingStreamRequestBody["messages"];
  nickname: string;
  bootstrap?: boolean;
  signal?: AbortSignal;
  /** Full visible assistant text so far (trailer stripped). */
  onVisibleUpdate: (visible: string) => void;
}

/**
 * POST /users/onboarding/chat/prompt — streams plain text like `/ai/prompt`, then optional
 * trailer {@link ONBOARDING_STREAM_TRAILER_MARK}`{...json}` for chips and flow state.
 */
export async function streamHostOnboardingChat(
  args: StreamHostOnboardingChatArgs,
): Promise<{ text: string; meta: OnboardingStreamMeta | null }> {
  const { onVisibleUpdate, signal, messages, nickname, bootstrap } = args;
  const storedAuth = localStorage.getItem(storageKeys.auth);
  const auth = storedAuth ? JSON.parse(storedAuth) : null;

  const payload: HostOnboardingStreamRequestBody = {
    messages,
    nickname,
    ...(bootstrap ? { bootstrap: true } : {}),
  };

  const response = await fetch(
    `${baseURL}${endpoint.hostOnboardingChatPrompt}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth?.access_token ?
          { Authorization: `Bearer ${auth.access_token}` }
        : {}),
      },
      signal,
      body: JSON.stringify(payload),
    },
  );

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  if (!response.ok || !reader) {
    const data = await response.json().catch(() => null);
    throw new Error(
      (data && typeof data.message === "string" && data.message) ||
        "Onboarding chat failed",
    );
  }

  let accumulated = "";
  let streamDone = false;
  while (!streamDone) {
    const { value, done } = await reader.read();
    streamDone = done;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      accumulated += chunk;
      onVisibleUpdate(visibleOnboardingStreamPrefix(accumulated));
    }
  }

  return splitOnboardingStreamBody(accumulated);
}
