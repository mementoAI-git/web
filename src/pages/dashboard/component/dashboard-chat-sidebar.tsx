"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useFetcher from "@/hooks/use-fetcher";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { streamlineFetcher } from "@/api/fetcher";
import { TimesIcon } from "@/components/icons";
import { DashboardChatInput } from "./dashboard-chat-input";
import Bubble, { Typing } from "@/pages/dashboard/chat/conversation/bubble";
import { isEmpty } from "@/utility";
import { toast } from "sonner";

type Message = { text: string; role: "user" | "ai" };

type StreamPayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
};

interface DashboardChatSidebarProps {
  onClose: () => void;
}

export function DashboardChatSidebar({ onClose }: DashboardChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);

  const { trigger: startConversation, isMutating: startingConversation } = useFetcher(
    endpoint.startConversation,
  );
  const { trigger: sendMessage, isMutating: isSending } = useSWRMutation<
    void,
    unknown,
    string,
    StreamPayload
  >(endpoint.aiPrompt, streamlineFetcher);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el?.scrollTo) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!isSending && aiMessage.trim()) {
      setMessages((p) => [...p, { text: aiMessage, role: "ai" }]);
      setAiMessage("");
    }
  }, [isSending, aiMessage]);

  const handleChunkArrival = useCallback(
    (chunk: string) => {
      if (chunk.trim().startsWith("ERROR: ")) {
        setAiMessage("");
        toast.error("Something went wrong, try again");
        return;
      }
      if (typeof chunk === "string" && chunk.trim() !== "") {
        setAiMessage((prev) => {
          if (prev && chunk.length > prev.length && chunk.startsWith(prev)) {
            return chunk;
          }
          return prev + chunk;
        });
        scrollToBottom();
      }
    },
    [scrollToBottom],
  );

  const handleSend = async ({ text }: { text: string }) => {
    if (!text.trim()) return;
    try {
      if (aiMessage?.trim()) {
        setMessages((p) => [...p, { text: aiMessage, role: "ai" }]);
        setAiMessage("");
      }
      setMessages((p) => [...p, { text, role: "user" }]);
      setTimeout(scrollToBottom, 50);

      if (memoryId) {
        abortCtrlRef.current = new AbortController();
        await sendMessage({
          text,
          attachments: [],
          memory: memoryId,
          signal: abortCtrlRef.current.signal,
          onChunk: handleChunkArrival,
        });
      } else {
        const result = await startConversation({ text, attachments: [] });
        const { memory_id, response } = result?.data ?? {};
        if (memory_id) {
          setMemoryId(memory_id);
          if (response?.trim()) {
            setMessages((p) => [...p, { text: response, role: "ai" }]);
          }
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        toast.error("Failed to send message");
        setAiMessage("");
      }
    } finally {
      abortCtrlRef.current = null;
    }
  };

  const isTyping = startingConversation || isSending;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between pl-[13px] pr-2 py-2">
        <h2 className="flex items-center gap-2 font-inter text-base font-medium text-v3-text-strong">
          Home Chat
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-full bg-v3-fill-weak transition-colors hover:bg-black/10"
          aria-label="Close chat"
        >
          <TimesIcon width={10} height={10} className="text-v3-icon-neutral" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2"
      >
        <div className="space-y-4 py-4">
          {messages.map((m, i) => (
            <Bubble key={i} text={m.text} role={m.role} compact />
          ))}
          {isTyping && isEmpty(aiMessage) && <Typing />}
          {aiMessage && <Bubble role="ai" text={aiMessage} compact />}
        </div>
      </div>
      <div className="shrink-0 px-2 py-2">
        <DashboardChatInput onSend={handleSend} loading={isTyping} />
      </div>
    </div>
  );
}
