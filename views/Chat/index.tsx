"use client";

import { useCallback, useEffect, useState } from "react";
import ChatInput from "./Input";
import { TypeMessage } from "./message";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { streamlineFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { IMessage } from "@/utility/interface";
import History from "./History";

export default function Chat() {
  const [prompt, setPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [abortController, setAbortController] = useState(null);
  const [messages, setMessages] = useState<Partial<IMessage | any>[]>(null)
  const { trigger, isMutating } = useSWRMutation(endpoint.aiPrompt, streamlineFetcher)
  const { trigger: triggerGreeting, isMutating: greeting } = useSWRMutation(endpoint.aiGreet, streamlineFetcher)

  const handleChuckArrival = useCallback((chunk: string) => {
    if (chunk.trim().startsWith("ERROR: ")) {
      setAiMessage("");
      return toast.error("Something went wrong, try again")
    }

    if (typeof chunk === 'string' && chunk.trim() !== '') {
      setAiMessage((prev) => prev + chunk);
    }
  }, []);

  const handleSend = async ({ attachments = [] }) => {
    if (isEmpty(prompt)) return;

    try {
      setMessages((p) => ([...p, { text: prompt, role: "user" }]));
      setPrompt("")
      setAiMessage("");

      const ctlr = new AbortController();
      setAbortController(ctlr);

      await trigger({
        text: prompt,
        attachments,
        signal: ctlr.signal,
        onChunk: handleChuckArrival
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to send message");
        setAiMessage("");
      }
    } finally {
      setAbortController(null);
    }
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    if (aiMessage) {
      setAiMessage((prev) => prev + "...");
    }
  };

  const handleOnFinishTyping = (text: string) => {
    if (text && text.trim()) {
      setMessages((p) => ([...p, { text, role: "ai" }]));
    }
    setAiMessage("");
    setPrompt("")
  }

  const isTyping = isMutating || greeting;

  return (
    <div className="flex h-screen flex-col hide-scrollbar">
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8 mx-auto max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-220">
        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 lg:py-8">
          <History {...{ messages, setMessages }}>
            {
              isTyping && !aiMessage ?
                <i>Typing...</i> :
                aiMessage &&
                <TypeMessage
                  text={aiMessage}
                  onFinish={handleOnFinishTyping}
                />
            }
          </History>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-[#e5e5e5] px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-220">
          <ChatInput
            text={prompt}
            onChangeText={setPrompt}
            onSend={handleSend}
            typing={isTyping}
            onStop={handleStop}
          />
        </div>
      </div>
    </div>
  )
}