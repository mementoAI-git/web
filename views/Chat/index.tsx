"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatInput from "./Input";
import Message, { TypeMessage } from "./message";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { streamlineFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { IMessage } from "@/utility/interface";
import useFetcher from "@/hooks/use-fetcher";
import Spinner from "@/components/Spinner";

export default function Chat() {
  const observerRef = useRef(null)
  const containerRef = useRef(null)
  const [prompt, setPrompt] = useState("")
  const [aiMessage, setAiMessage] = useState("")
  const [abortController, setAbortController] = useState(null);
  const [messages, setMessages] = useState<Partial<IMessage | any>[]>([])
  const [next, setNext] = useState(null)
  const { trigger, isMutating } = useSWRMutation(endpoint.aiPrompt, streamlineFetcher)
  const { trigger: getMessages, isMutating: loading } = useFetcher(`${endpoint.aiPromptMessage}?next=${next || ""}`, "get")

  const fetchMessage = useCallback(async () => {
    try {
      const { data } = await getMessages()
      if (!data || isEmpty(data?.messages)) return;

      if (isEmpty(messages)) setMessages(data?.messages)
      else setMessages(p => [...data?.messages, ...p]);

      setNext(data?.next)
    } catch (error) {
      console.log(error)
    }
  }, [messages, getMessages])

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

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAiMessage((prev) => prev + "...");
      setAbortController(null);
    }
  };

  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log("Observer element is in viewport, fetching more...");
          fetchMessage();
        }
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.5,
      }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
      observer.disconnect();
    };
  }, [loading, fetchMessage, containerRef.current]);

  const handleOnFinishTyping = (text: string) => {
    setMessages((p) => [...p, { text, role: "ai" }]);
    setAiMessage("");
    setPrompt("")
  }

  useEffect(() => {
    fetchMessage()
  }, [])

  return (
    <div className="w-full flex justify-center">
      <div style={{ height: 'calc(100vh - 88px)' }} className="mx-auto overflow-x-hidden flex flex-col w-full max-w-220 flex-1">
        <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 pt-8  space-y-4 overflow-x-hidden flex flex-col gap-2 justify-end">
          <div ref={observerRef} className="mt-5 flex justify-center items-center h-10 w-full">
            {
              (loading || next) &&
              <div className="flex gap-1.5">
                <span>Loading...</span>
                <div>
                  <Spinner loading={loading} className="!size-3" />
                </div>
              </div>
            }
          </div>
          {messages.map((m, i) => <Message key={i} {...m} />)}
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
            typing={isMutating}
            onStop={handleStop}
          />
        </div>
      </div>
    </div >
  )
}