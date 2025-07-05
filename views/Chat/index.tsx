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
import dayjs from "dayjs";

export default function Chat() {
  const [prompt, setPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [abortController, setAbortController] = useState(null);
  const [messages, setMessages] = useState<Partial<IMessage | any>[]>(null)
  const { trigger, isMutating } = useSWRMutation(endpoint.aiPrompt, streamlineFetcher)
  const { trigger: triggerGreeting, isMutating: greeting } = useSWRMutation(endpoint.aiGreet, streamlineFetcher)

  const handleChuckArrival = (chunk: string) => {
    if (chunk.trim().startsWith("ERROR: ")) {
      return toast.error("Something went wrong, try again")
    }
    if (typeof chunk === 'string' && chunk.trim() !== '') {
      setAiMessage((p) => p + chunk);
    }
  }

  const handleTriggerGreeting = useCallback(() => {
    if (!messages) return;
    const lastMessage = messages[messages.length - 1];
    const last_seen = lastMessage ? dayjs().diff(lastMessage.created_at, 'millisecond') : 0;

    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // a day
    if (lastMessage && lastMessage.role === "ai") return;

    if (isEmpty(messages.length) || (last_seen > ONE_DAY_MS) || lastMessage.role === "user") {
      return triggerGreeting({ onChunk: handleChuckArrival })
    }
  }, [messages])

  const handleSend = async ({ attachments = [] }) => {
    if (isEmpty(prompt)) return;
    setMessages((p) => ([...p, { text: prompt, role: "user" }]));
    setPrompt("")
    setAiMessage("");
    const ctlr = new AbortController();
    setAbortController(ctlr);

    return await trigger({
      text: prompt,
      attachments,
      signal: ctlr.signal,
      onChunk: handleChuckArrival
    })
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAiMessage((prev) => prev + "...");
      setAbortController(null);
    }
  };

  const handleOnFinishTyping = (text: string) => {
    setMessages((p) => ([...p, { text, role: "ai" }]));
    setAiMessage("");
    setPrompt("")
  }

  useEffect(() => {
    handleTriggerGreeting()
  }, [messages])

  return (
    <div className="flex justify-center w-full h-full min-h-0">
      <div
        style={{ height: 'calc(100vh - 88px)' }}
        className="mx-auto flex flex-col w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-220 px-2 sm:px-4 md:px-8 size-full min-h-0"
      >
        <History {...{ messages, setMessages }}>
          {
            (isMutating || greeting) ?
              <i>Typing...</i> :
              aiMessage &&
              <TypeMessage
                text={aiMessage}
                onFinish={handleOnFinishTyping}
              />
          }
        </History>
        <div className="pb-2 sm:pb-4 px-1 sm:px-0 w-full">
          <ChatInput
            text={prompt}
            onChangeText={setPrompt}
            onSend={handleSend}
            typing={isMutating || greeting}
            onStop={handleStop}
          />
        </div>
      </div>
    </div >
  )
}