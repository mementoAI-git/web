"use client";

import { useState } from "react";
import ChatInput from "./Input";
import Message, { TypeMessage } from "./message";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { fetcher, streamlineFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { IMessage, IPagination } from "@/utility/interface";
import useSWR from "swr";

export default function Chat() {
  const [prompt, setPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [messages, setMessages] = useState<IPagination<Partial<IMessage>>>(null)
  const { trigger, isMutating } = useSWRMutation(endpoint.aiPrompt, streamlineFetcher)
  useSWR(endpoint.aiPromptMessage, fetcher, {
    onSuccess(data) {
      if (data?.data) {
        setMessages(data.data)
      }
    }
  })

  const handleSend = async () => {
    if (isEmpty(prompt)) return;
    setMessages((p) => ({ ...p, docs: [...p.docs, { text: prompt, role: "user" }] }));
    setPrompt("")
    setAiMessage("");

    await trigger({
      text: prompt,
      onChunk: (chunk: string) => {
        if (chunk.trim().startsWith("ERROR: ")) {
          return toast.error("Something went wrong, try again")
        }
        if (typeof chunk === 'string' && chunk.trim() !== '') {
          setAiMessage((p) => p + chunk);
        }
      }
    })
  }

  const handleOnFinishTyping = (text: string) => {
    setMessages((p) => ({ ...p, docs: [...p.docs, { text, role: "ai" }] }));
    setAiMessage("");
    setPrompt("")
  }
  return (
    <div className="w-full flex justify-center">
      <div style={{ height: 'calc(100vh - 88px)' }} className="mx-auto overflow-x-hidden flex flex-col w-full max-w-220 flex-1">
        <div className="flex-1 overflow-y-auto px-4 py-6 pt-8  space-y-4 overflow-x-hidden flex flex-col gap-2 justify-end">
          <div />
          {messages?.docs.map((m, i) => <Message key={i} text={m.text} isUser={m.role === "user"} />)}
          {
            aiMessage &&
            <TypeMessage
              text={aiMessage}
              onFinish={handleOnFinishTyping}
            />
          }
        </div>
        <div className="pb-4">
          <ChatInput
            text={prompt}
            onChangeText={setPrompt}
            onSend={handleSend}
            disabled={isMutating}
          />
        </div>
      </div>
    </div >
  )
}