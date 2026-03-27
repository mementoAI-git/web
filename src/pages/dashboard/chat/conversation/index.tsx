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
import {
  buildPromptWithReplyQuote,
  type ChatReplyQuote,
} from "@/utility/chat-reply-prompt";
import {
  buildConversationMarkdown,
  downloadMarkdownFile,
  sanitizeConversationFilename,
} from "@/utility/export-conversation-markdown";
import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import type { ChatMode, LifeDimension } from "@/features/host-chat/chat.types";
import { dimensionLabel } from "@/features/host-chat/chat.types";
import {
  DeepDiveBanner,
  DeepDiveNudge,
  HostChatEnrichmentBar,
  HostChatJumpPills,
  MilestoneCard,
  dismissHostChatNudge,
  getDismissedHostChatNudges,
  monthKeysFromMessages,
} from "@/features/host-chat";

const DEFAULT_DEEP_DIVE_NUDGE_DIMENSION: LifeDimension = "relationships_people";

type StreamlinePayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
  chatMode?: ChatMode;
  deepDiveDimension?: LifeDimension | null;
  dismissedNudgeDimensions?: string[];
};

export default function Conversation({ id, type = "memory" }) {
  const [aiMessage, setAiMessage] = useState("")
  const abortCtrl = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);
  const isNew = id === "new";
  const isHostChat = type === "memory" && !isNew;
  const { setHeaderTitle } = useStore();
  const { setChrome } = useConversationChrome();
  const { open } = useModal();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Partial<IMessage | any>[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar closed by default
  const [replyQuote, setReplyQuote] = useState<ChatReplyQuote | null>(null)
  const [chatMode, setChatMode] = useState<ChatMode>("open");
  const [deepDiveDimension, setDeepDiveDimension] = useState<LifeDimension | null>(null);
  const [nudgeHidden, setNudgeHidden] = useState(false);
  const [lastEnrichmentDelta] = useState<number | null>(null);

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

  const exchangeCount = useMemo(() => {
    let n = messages.length;
    if (aiMessage?.trim()) n += 1;
    return n;
  }, [messages.length, aiMessage]);

  const hostChatSubtitle = useMemo(() => {
    if (!isHostChat || !memory?.created_at) return undefined;
    const since = dayjs(memory.created_at);
    const sinceLabel = since.isValid() ? since.format("MMM D, YYYY") : "";
    return sinceLabel ?
        `${exchangeCount} exchange${exchangeCount === 1 ? "" : "s"} · since ${sinceLabel}` :
        `${exchangeCount} exchange${exchangeCount === 1 ? "" : "s"}`;
  }, [isHostChat, memory?.created_at, exchangeCount]);

  const jumpMonthKeys = useMemo(() => monthKeysFromMessages(messages), [messages]);

  const showDeepDiveNudge =
    isHostChat &&
    chatMode === "open" &&
    !nudgeHidden &&
    !getDismissedHostChatNudges().includes(DEFAULT_DEEP_DIVE_NUDGE_DIMENSION);

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

  const handleOnFinishTyping = useCallback((text: string) => {
    if (text && text.trim()) {
      setMessages((p) => ([
        ...p,
        {
          text,
          role: "ai",
          created_at: new Date().toISOString(),
        },
      ]));
    }
    setAiMessage("");
  }, []);

  const sendChatMessage = useCallback(
    async (
      { text, attachments = [], replyTo }: IOnSendPayload,
      options: { appendUserMessage: boolean },
    ) => {
      if (isEmpty(text)) return;
      const apiText = buildPromptWithReplyQuote(text, replyTo ?? null);
      try {
        if (aiMessage && aiMessage.trim()) {
          setMessages((p) => ([
            ...p,
            {
              text: aiMessage,
              role: "ai",
              created_at: new Date().toISOString(),
            },
          ]));
          setAiMessage("");
        }

        if (options.appendUserMessage) {
          const trimmedReply =
            replyTo?.text?.trim() ?
              { role: replyTo.role, text: replyTo.text.trim() } :
              undefined;
          const now = new Date().toISOString();
          setMessages((p) => ([
            ...p,
            {
              text,
              role: "user",
              attatchments: attachments,
              created_at: now,
              ...(trimmedReply ? { replyTo: trimmedReply } : {}),
            },
          ]));
          setReplyQuote(null);
        }

        setTimeout(scrollToBottom, 50);

        if (memory?._id) {
          abortCtrl.current = new AbortController();

          await sendMessage({
            text: apiText,
            attachments: attachments.map((a) => a._id),
            memory: memory?._id,
            signal: abortCtrl.current.signal,
            onChunk: handleChuckArrival,
            chatMode,
            deepDiveDimension: chatMode === "deep_dive" ? deepDiveDimension : null,
            dismissedNudgeDimensions: getDismissedHostChatNudges(),
          })
          return;
        }

        const result = await startConversation({
          text: apiText,
          ...(isNew ? {} : { prompt_id: id })
        })

        if (result?.data?.response) {
          handleOnFinishTyping(result?.data?.response)
          mutate(`${endpoint.memoryPrompt}/${id}`)
          navigate(`/chat/${result?.data?.memory_id}`)
        }

      } catch (error: unknown) {
        const errName = error instanceof Error ? error.name : "";
        if (errName !== "AbortError") {
          toast.error("Failed to send message");
          setAiMessage("");
          if (options.appendUserMessage) {
            setMessages((p) => {
              const n = [...p];
              const last = n[n.length - 1];
              if (last?.role === "user" && last.text === text) {
                n[n.length - 1] = { ...last, sendFailed: true };
              }
              return n;
            });
          }
        }
      } finally {
        abortCtrl.current = null
      }
    },
    [
      aiMessage,
      memory?._id,
      id,
      isNew,
      scrollToBottom,
      sendMessage,
      handleChuckArrival,
      startConversation,
      handleOnFinishTyping,
      navigate,
      mutate,
      chatMode,
      deepDiveDimension,
    ],
  );

  const jumpToMonth = useCallback((yyyyMm: string) => {
    const el = document.getElementById(`host-chat-anchor-${yyyyMm}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleExitDeepDive = useCallback(() => {
    setChatMode("open");
    setDeepDiveDimension(null);
    toast.success("Returned to open conversation");
  }, []);

  const handleStartDeepDiveFromNudge = useCallback(() => {
    setDeepDiveDimension(DEFAULT_DEEP_DIVE_NUDGE_DIMENSION);
    setChatMode("deep_dive");
    setNudgeHidden(true);
  }, []);

  const handleDismissNudge = useCallback(() => {
    dismissHostChatNudge(DEFAULT_DEEP_DIVE_NUDGE_DIMENSION);
    setNudgeHidden(true);
  }, []);

  const handleSend = useCallback(
    (payload: IOnSendPayload) => {
      void sendChatMessage(payload, { appendUserMessage: true });
    },
    [sendChatMessage],
  );

  const handleExportConversation = useCallback(() => {
    const hasStreaming = Boolean(aiMessage?.trim());
    if (messages.length === 0 && !hasStreaming) {
      toast.error("Nothing to export yet");
      return;
    }
    const title = memory?.title?.trim() || "Conversation";
    const md = buildConversationMarkdown(title, messages, {
      streamingAssistantText: hasStreaming ? aiMessage : undefined,
    });
    downloadMarkdownFile(sanitizeConversationFilename(title), md);
    toast.success("Conversation exported");
  }, [aiMessage, memory?.title, messages]);

  const handleRetryFailedMessage = useCallback(() => {
    let failIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const row = messages[i] as { role?: string; sendFailed?: boolean };
      if (row?.role === "user" && row.sendFailed) {
        failIdx = i;
        break;
      }
    }
    if (failIdx === -1) return;
    const m = messages[failIdx] as {
      text?: string;
      attatchments?: IOnSendPayload["attachments"];
      sendFailed?: boolean;
    };
    setMessages((p) => {
      const n = [...p];
      n[failIdx] = { ...n[failIdx], sendFailed: false };
      return n;
    });
    void sendChatMessage(
      {
        text: m.text ?? "",
        attachments: m.attatchments ?? [],
        replyTo: (m as { replyTo?: ChatReplyQuote }).replyTo,
      },
      { appendUserMessage: false },
    );
  }, [messages, sendChatMessage]);

  const handleReplyToMessage = useCallback(
    (quote: ChatReplyQuote) => {
      setReplyQuote(quote);
      setTimeout(scrollToBottom, 80);
    },
    [scrollToBottom],
  );

  const handleStop = () => {
    if (abortCtrl.current) {
      abortCtrl.current.abort();
      abortCtrl.current = null
    }
    if (aiMessage) {
      setAiMessage((prev) => prev + "...");
    }
  };

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
    if (isHostChat) {
      setHeaderTitle(null);
    } else {
      setHeaderTitle(memory?.title || "New conversation");
    }
    return () => {
      setHeaderTitle(null);
    };
  }, [isHostChat, memory?.title, setHeaderTitle]);

  useEffect(() => {
    if (loadingMemory || loadingPrompt) {
      setChrome(null);
      return;
    }
    setChrome({
      memory: memory ?? null,
      onViewDetails: handleOpenSidebar,
      onExportConversation: handleExportConversation,
      ...(isHostChat ?
        {
          hostChat: {
            title: "Your Memento",
            subtitle: hostChatSubtitle,
            onSearch: () => open("search-memory"),
          },
        } :
        {}),
    });
  }, [
    loadingMemory,
    loadingPrompt,
    memory,
    handleOpenSidebar,
    handleExportConversation,
    setChrome,
    isHostChat,
    hostChatSubtitle,
    open,
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
          {isHostChat ? (
            <div className="flex w-full flex-col gap-3 pt-2 pb-4 sm:px-3 md:px-5">
              <HostChatEnrichmentBar />
              <HostChatJumpPills monthKeys={jumpMonthKeys} onJump={jumpToMonth} />
              {chatMode === "deep_dive" && deepDiveDimension ? (
                <DeepDiveBanner
                  dimensionLabel={dimensionLabel(deepDiveDimension)}
                  onExit={handleExitDeepDive}
                />
              ) : null}
              <MilestoneCard enrichmentDelta={lastEnrichmentDelta} />
              {showDeepDiveNudge ? (
                <DeepDiveNudge
                  dimension={DEFAULT_DEEP_DIVE_NUDGE_DIMENSION}
                  onDeepDive={handleStartDeepDiveFromNudge}
                  onDismiss={handleDismissNudge}
                />
              ) : null}
            </div>
          ) : null}
          <History
            {...{
              memory,
              messages,
              setMessages,
              scrollContainerRef,
              onViewDetails: handleOpenSidebar,
              onRetryFailedMessage: handleRetryFailedMessage,
              onReplyToMessage: handleReplyToMessage,
              hostChatDeepDive: isHostChat && chatMode === "deep_dive",
            }}
          >
            {(isTyping && isEmpty(aiMessage)) ?
              <Typing /> :
              <Bubble
                role="ai"
                text={aiMessage}
                hostChatDeepDive={isHostChat && chatMode === "deep_dive"}
                onReply={
                  aiMessage.trim() ?
                    () =>
                      handleReplyToMessage({
                        role: "ai",
                        text: aiMessage.trim(),
                      }) :
                    undefined
                }
              />
            }
          </History>
          <div className="sticky bottom-0 bg-white px-0 pb-4 sm:px-3 md:px-5">
            <div className="w-full">
              <ConversationChatinput
                key={`chat-draft-${memory?._id ?? id}`}
                loading={isTyping}
                onStop={handleStop}
                onSend={handleSend}
                history={messages.slice(-20).map(({ role, text }) => ({ role, text }))}
                inputClassName="!text-sm sm:!text-lg md:!text-xl"
                memoryId={memory?._id || null}
                draftStorageKey={`memento-chat-draft:${memory?._id ?? id}`}
                replyQuote={replyQuote}
                onClearReplyQuote={() => setReplyQuote(null)}
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
