"use client";

import { useState } from "react";
import ChatInput from "./Input";
import Message, { TypeMessage } from "./message";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { streamlineFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";

export default function Chat() {
  const [prompt, setPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [messages, setMessages] = useState([])
  const { trigger, isMutating } = useSWRMutation(endpoint.ai, streamlineFetcher)

  const handleSend = async () => {
    if (isEmpty(prompt)) return;
    setMessages((p) => [...p, { text: prompt, isUser: true }]);
    setPrompt("")
    setAiMessage("");

    await trigger({
      text: prompt,
      onChunk: (chunk: string) => {
        if (typeof chunk === 'string' && chunk.trim() !== '') {
          setAiMessage((p) => p + chunk);
        }
      }
    })
  }

  const handleOnFinishTyping = (text: string) => {
    setMessages((prev) => [...prev, { text, isUser: false }]);
    setAiMessage("");
    setPrompt("")
  }
  return (
    <div className="w-full flex justify-center">
      <div style={{ height: 'calc(100vh - 88px)' }} className="mx-auto flex flex-col w-full max-w-220 flex-1">
        <div className="flex-1 overflow-y-auto px-4 py-6 pt-8  space-y-4 overflow-auto flex flex-col gap-2 justify-end">
          <div />
          {messages.map(m => <Message {...m} />)}
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