import { useCallback, useSyncExternalStore } from "react";
import { useStore } from "@/hooks/use-store";

/**
 * "Record conversations": save each voice conversation to Stories with its
 * audio. On unless the host turns it off, as on mobile. Kept per account in
 * this browser; it applies from the next call.
 */

const CHANGE_EVENT = "memento:record-conversations";

export function recordConversationsKey(userKey: string) {
  return `memento.voice-preference.${userKey}.record`;
}

/** On by default: only an explicit "false" turns it off. */
export function parseRecordConversations(raw: string | null): boolean {
  return raw !== "false";
}

export function readRecordConversations(userKey: string | null | undefined): boolean {
  if (!userKey) return true;
  try {
    return parseRecordConversations(window.localStorage.getItem(recordConversationsKey(userKey)));
  } catch {
    return true;
  }
}

export function writeRecordConversations(userKey: string, enabled: boolean) {
  try {
    window.localStorage.setItem(recordConversationsKey(userKey), String(enabled));
  } catch {
    // Storage is unavailable (private mode); the choice lasts for this page.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useRecordConversations() {
  const { user } = useStore();
  const userKey = user?._id ?? user?.email ?? null;
  const enabled = useSyncExternalStore(subscribe, () => readRecordConversations(userKey), () => true);
  const setEnabled = useCallback((next: boolean) => {
    if (userKey) writeRecordConversations(userKey, next);
  }, [userKey]);
  return { enabled, setEnabled, userKey };
}
