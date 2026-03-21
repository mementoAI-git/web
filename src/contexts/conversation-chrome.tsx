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
  onViewDetails?: () => void;
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

export function useConversationChrome() {
  const ctx = useContext(ConversationChromeContext);
  if (!ctx) {
    throw new Error("useConversationChrome must be used within ConversationChromeProvider");
  }
  return ctx;
}
