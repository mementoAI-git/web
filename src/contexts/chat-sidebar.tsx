"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

interface ChatSidebarContextValue {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextValue | null>(null);

export function ChatSidebarProvider({ children }: PropsWithChildren) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <ChatSidebarContext.Provider value={{ chatOpen, setChatOpen }}>
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  const ctx = useContext(ChatSidebarContext);
  return ctx ?? { chatOpen: false, setChatOpen: () => {} };
}
