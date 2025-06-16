import endpoint from "@/api/endpoint"
import useFetcher from "@/hooks/use-fetcher"
import { IMessage } from "@/utility/interface"
import { Dispatch, PropsWithChildren, SetStateAction, useCallback, useEffect, useRef, useState } from "react"
import Message from "./message"
import Spinner from "@/components/Spinner"
import { isEmpty } from "@/utility"

interface IHistory extends PropsWithChildren {
  setMessages: Dispatch<SetStateAction<Partial<IMessage>[]>>,
  messages: Partial<IMessage>[]
}

export default function History({ messages, setMessages, children }: IHistory) {
  const observerRef = useRef(null)
  const containerRef = useRef(null)
  const [next, setNext] = useState(null)
  const { trigger: getMessages, isMutating: loading, } = useFetcher(`${endpoint.aiPromptMessage}?next=${next || ""}`, "get")

  const fetchMessage = useCallback(async () => {
    try {
      const { data } = await getMessages()
      if (!data) return;

      if (isEmpty(messages)) setMessages(data?.messages || [])
      else setMessages(p => [...data?.messages, ...p]);

      setNext(data?.next)
    } catch (error) {
      console.log(error)
    }
  }, [messages, getMessages])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isEmpty(next)) {
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
  }, [fetchMessage]);

  useEffect(() => {
    fetchMessage()
  }, [])

  return (
    <div ref={containerRef} className="size-full overflow-x-hidden overflow-y-auto px-4 py-6 pt-8 space-y-4  gap-2 justify-end">
      <div ref={observerRef} className="mt-10 py-5 flex justify-center items-center h-10 w-full">
        {
          (loading && next) &&
          <div className="flex gap-1.5">
            <span>Loading...</span>
            <div>
              <Spinner loading={loading} className="!size-3" />
            </div>
          </div>
        }
      </div>
      {messages && messages.map((m, i) => <Message key={i} {...m} />)}
      {children}
    </div>
  )
}