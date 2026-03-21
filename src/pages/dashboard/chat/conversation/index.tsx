import {
  ConversationChatinput,
  type IOnSendPayload,
} from "@/components/Chatinput";
import Bubble, { Typing } from "./bubble";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { cn, isEmpty } from "@/utility";
import History from "./history";
import { type IMessage } from "@/utility/interface";
import Loader from "./loader";
import useSWRMutation from "swr/mutation";
import { streamlineFetcher } from "@/api/fetcher";
import { toast } from "sonner";
import SidebarDetails from "@/components/memory/sidebar-details";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useNavigate } from "react-router-dom";
import { useConversationChrome } from "@/contexts/conversation-chrome";

type StreamlinePayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
};

export default function Conversation({ id, type = "memory" }) {
  const [aiMessage, setAiMessage] = useState("")
  const abortCtrl = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);
  const isNew = id === "new";
  const { setHeaderTitle } = useStore();
  const { setChrome } = useConversationChrome();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Partial<IMessage | any>[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar closed by default

  const { trigger: sendMessage, isMutating: isSending } = useSWRMutation<
    void,
    unknown,
    string,
    StreamlinePayload
  >(endpoint.aiPrompt, streamlineFetcher)

  const { data: memoryData, isLoading: loadingMemory } = useSWR(
    id && type === "memory" && !isNew ? `${endpoint.memories}/${id}` : null
  );
  const { data: promptData, isLoading: loadingPrompt } = useSWR(
    id && type === "prompt" && !isNew ?
      `${endpoint.memoryPrompt}/${id}` :
      null
  );

  const { trigger: startConversation, isMutating: startingConversation } = useFetcher(endpoint.startConversation)

  const memory = useMemo(() => memoryData?.data || promptData?.data, [promptData, memoryData]);

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Close sidebar handler
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Open sidebar handler 
  const handleOpenSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const handleChuckArrival = useCallback((chunk: string) => {
    if (chunk.trim().startsWith("ERROR: ")) {
      setAiMessage("");
      return toast.error("Something went wrong, try again")
    }

    if (typeof chunk === 'string' && chunk.trim() !== '') {
      setAiMessage((prev) => {
        if (prev && chunk.length > prev.length && chunk.startsWith(prev)) {
          return chunk;
        } else {
          return prev + chunk;
        }
      });

      scrollToBottom();
    }
  }, [scrollToBottom]);

  const handleSend = async ({ text, attachments = [] }: IOnSendPayload) => {
    if (isEmpty(text)) return;
    try {
      // If there's an ongoing AI response, finalize it first
      if (aiMessage && aiMessage.trim()) {
        setMessages((p) => ([...p, {
          text: aiMessage,
          role: "ai"
        }]));
        setAiMessage("");
      }

      // Then add the new user message
      setMessages((p) => ([...p, { text, role: "user", attatchments: attachments }]));

      // Always scroll to bottom when the user sends a message
      setTimeout(scrollToBottom, 50);

      if (memory?._id) {
        abortCtrl.current = new AbortController();

        await sendMessage({
          text,
          attachments: attachments.map(a => a._id),
          memory: memory?._id,
          signal: abortCtrl.current.signal,
          onChunk: handleChuckArrival
        })
        return;
      }

      const result = await startConversation({
        text,
        ...(isNew ? {} : { prompt_id: id })
      })

      if (result?.data?.response) {
        handleOnFinishTyping(result?.data?.response)
        mutate(`${endpoint.memoryPrompt}/${id}`)
        navigate(`/chat/${result?.data?.memory_id}`)
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to send message");
        setAiMessage("");
      }
    } finally {
      abortCtrl.current = null
    }
  }

  const handleStop = () => {
    if (abortCtrl.current) {
      abortCtrl.current.abort();
      abortCtrl.current = null
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
  }

  // Update wasAtBottomRef on scroll to manage conditional scrolling
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      wasAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 50; // A 50px buffer
    }
  }, []);

  // Use a single useEffect to handle the initial load and all message updates
  useEffect(() => {
    if (messages.length > 0) {
      if (wasAtBottomRef.current) {
        // Use a small delay to ensure DOM is updated before scrolling
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setHeaderTitle(memory?.title || "New conversation");
    return () => {
      setHeaderTitle(null);
    };
  }, [memory?.title, setHeaderTitle]);

  useEffect(() => {
    if (loadingMemory || loadingPrompt) {
      setChrome(null);
      return;
    }
    setChrome({
      memory: memory ?? null,
      onViewDetails: handleOpenSidebar,
    });
  }, [
    loadingMemory,
    loadingPrompt,
    memory,
    handleOpenSidebar,
    setChrome,
  ]);

  useEffect(() => () => setChrome(null), [setChrome]);

  if (loadingMemory || loadingPrompt) {
    return <Loader />
  }
  const isTyping = isSending || startingConversation;

  return (
    <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden items-stretch h-full">
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
        <div
          className={cn(
            "hide-scrollbar flex h-full min-h-0 w-full min-w-0 max-w-[800px] flex-col overflow-y-auto",
            { ["px-5"]: isSidebarOpen },
          )}
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <History {...{
            memory,
            messages,
            setMessages,
            scrollContainerRef,
            onViewDetails: handleOpenSidebar
          }}>
            {
              (isTyping && isEmpty(aiMessage)) ?
                <Typing /> :
                <Bubble role="ai" text={aiMessage} />
            }
          </History>
          <div className="sticky bottom-0 bg-white px-0 pb-4 sm:px-3 md:px-5">
            <div className="w-full">
              <ConversationChatinput
                loading={isTyping}
                onStop={handleStop}
                onSend={handleSend}
                history={messages.slice(-20).map(({ role, text }) => ({ role, text }))}
                inputClassName="!text-sm sm:!text-lg md:!text-xl"
                memoryId={memory?._id || null}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Updated sidebar with slide-in transition */}
      {
        memory?._id &&
        <SidebarDetails
          memory={memory}
          onClose={handleCloseSidebar}
          isOpen={isSidebarOpen}
          source={type === "prompt" ? "prompt" : "conversation"}
        />
      }
    </div>
  );
}
