"use client";

import type { IMemory } from "@/utility/interface";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ConversationChromeState = {
  memory: IMemory | null;
  /** Open the unified conversation settings drawer. */
  onOpenChatPreferences?: () => void;
  spokenReplies?: { isLoading?: boolean; enabled: boolean; supported: boolean; onToggle: () => void };
  /** Single-thread Host Chat chrome (top bar title, subtitle, search). */
  hostChat?: {
    title: string;
    subtitle?: string;
    onSearch?: () => void;
  };
};

type ConversationChromeContextValue = {
  chrome: ConversationChromeState | null;
  setChrome: (state: ConversationChromeState | null) => void;
};

const ConversationChromeContext =
  createContext<ConversationChromeContextValue | null>(null);

export function ConversationChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<ConversationChromeState | null>(null);

  const setChrome = useCallback((state: ConversationChromeState | null) => {
    setChromeState(state);
  }, []);

  const value = useMemo(
    () => ({ chrome, setChrome }),
    [chrome, setChrome],
  );

  return (
    <ConversationChromeContext.Provider value={value}>
      {children}
    </ConversationChromeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConversationChrome() {
  const ctx = useContext(ConversationChromeContext);
  if (!ctx) {
    throw new Error("useConversationChrome must be used within ConversationChromeProvider");
  }
  return ctx;
}
