"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";

interface IChatData {
  text: string;
  attachments: string[];
  title?: string;
  level?: string;
  tags?: string[];
}

interface IChatContext {
  data: IChatData | null;
  startChat: (data: IChatData | null) => void;
  clearChat: () => void;
}

const chatContext = createContext<IChatContext>({
  data: null,
  startChat: () => { },
  clearChat: () => { },
});

export function ChatProvider({ children }: PropsWithChildren) {
  const [data, startChat] = useState<IChatData | null>(null);

  const clearChat = useCallback(() => {
    startChat(null);
  }, []);

  return (
    <chatContext.Provider value={{ data, startChat, clearChat }}>
      {children}
    </chatContext.Provider>
  );
}

export const useChat = () => useContext(chatContext); 