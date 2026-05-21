import {
  ConversationChatinput,
  type IOnSendPayload,
} from "@/components/Chatinput";
import Bubble, { Typing, TypingBubble } from "./bubble";
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
import { useMatch, useNavigate } from "react-router-dom";
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
  HostChatJumpPills,
  MilestoneCard,
  dismissHostChatNudge,
  getDismissedHostChatNudges,
  monthKeysFromMessages,
} from "@/features/host-chat";
import { useEnrichmentStats } from "@/features/enrichment";
import { useSubscription } from "@/contexts/subscription";
import { VoiceModePaywall } from "@/features/pricing/voice-mode-paywall";

type StreamlinePayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
  onMeta?: (meta: { model?: string }) => void;
  chatMode?: ChatMode;
  deepDiveDimension?: LifeDimension | null;
  dismissedNudgeDimensions?: string[];
};

export default function Conversation({ id, type = "memory" }) {
  const [aiMessage, setAiMessage] = useState("")
  const [streamModelLabel, setStreamModelLabel] = useState<string | undefined>(undefined);
  const abortCtrl = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);
  const isNew = id === "new";
  const isHostChat = type === "memory" && !isNew;
  const { setHeaderTitle } = useStore();
  const { setChrome } = useConversationChrome();
  const { open, push } = useModal();
  const navigate = useNavigate();
  const voiceRouteMatch = useMatch({ path: "/chat/:id/voice", end: true });
  const isVoiceRoute = Boolean(voiceRouteMatch);
  const { canAccess, isLoading: subscriptionLoading } = useSubscription();
  const [messages, setMessages] = useState<Partial<IMessage>[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar closed by default
  const [sidebarTab, setSidebarTab] = useState<"memory" | "chat">("memory")
  const [replyQuote, setReplyQuote] = useState<ChatReplyQuote | null>(null)
  const [chatMode, setChatMode] = useState<ChatMode>("open");
  const [deepDiveDimension, setDeepDiveDimension] = useState<LifeDimension | null>(null);
  const [nudgeHidden, setNudgeHidden] = useState(false);
  const [sessionEnrichmentDelta, setSessionEnrichmentDelta] = useState<number | null>(null);
  const [streamDone, setStreamDone] = useState(false);
  const sessionStartScoreRef = useRef<number | null>(null);

  const {
    stats: enrichmentStats,
    deltaToday,
    milestoneJustReached,
    nudgeDimension,
    nudgeQuestion,
  } = useEnrichmentStats();

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

  // Capture session start score once, then track delta as enrichment updates
  useEffect(() => {
    if (!enrichmentStats) return;
    const currentScore = enrichmentStats.enrichment_score;
    if (sessionStartScoreRef.current === null) {
      sessionStartScoreRef.current = currentScore;
    } else {
      const delta = currentScore - sessionStartScoreRef.current;
      if (delta > 0) setSessionEnrichmentDelta(delta);
    }
  }, [enrichmentStats?.enrichment_score]);

  const activeDimension = nudgeDimension ?? "relationships_people";
  const showDeepDiveNudge =
    isHostChat &&
    chatMode === "open" &&
    !nudgeHidden &&
    !getDismissedHostChatNudges().includes(activeDimension);

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
    setSidebarTab("memory");
  }, []);

  // Toggle sidebar handler
  const handleOpenSidebar = useCallback(() => {
    setSidebarTab("memory");
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleOpenChatPreferences = useCallback(() => {
    setSidebarTab("chat");
    setIsSidebarOpen((prev) => !prev);
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
          ai_model: streamModelLabel,
          created_at: new Date().toISOString(),
        },
      ]));
    }
    setAiMessage("");
    setStreamModelLabel(undefined);
    // Refetch enrichment stats after each AI response to update delta + milestone
    mutate(endpoint.userStats);
  }, [streamModelLabel]);

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
          setStreamDone(false);
          setStreamModelLabel(undefined);

          await sendMessage({
            text: apiText,
            attachments: attachments.map((a) => a._id),
            memory: memory?._id,
            signal: abortCtrl.current.signal,
            onChunk: handleChuckArrival,
            onMeta: ({ model }) => setStreamModelLabel(model),
            chatMode,
            deepDiveDimension: chatMode === "deep_dive" ? deepDiveDimension : null,
            dismissedNudgeDimensions: getDismissedHostChatNudges(),
          })
          setStreamDone(true);
          return;
        }

        const result = await startConversation({
          text: apiText,
        })

        if (result?.data?.response) {
          handleOnFinishTyping(result?.data?.response)
          // Invalidate profile so primary_conversation_id is fresh
          mutate(endpoint.profile)
          navigate(`/chat/${result?.data?.memory_id}`, { replace: true })
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
        setStreamDone(true);
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
    setDeepDiveDimension(activeDimension);
    setChatMode("deep_dive");
    setNudgeHidden(true);
  }, [activeDimension]);

  const handleDismissNudge = useCallback(() => {
    dismissHostChatNudge(activeDimension);
    setNudgeHidden(true);
  }, [activeDimension]);

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
      if (isVoiceRoute && voiceRouteMatch?.params?.id) {
        setChrome({
          memory: null,
          onViewDetails: handleOpenSidebar,
          onOpenChatPreferences: undefined,
          onExportConversation: undefined,
          hostChat: {
            title: "Voicemode",
            subtitle: undefined,
            onSearch: () => open("search-memory"),
          },
        });
      } else {
        setChrome(null);
      }
      return;
    }
    setChrome({
      memory: memory ?? null,
      onViewDetails: handleOpenSidebar,
      onOpenChatPreferences: memory?._id ? handleOpenChatPreferences : undefined,
      onExportConversation: handleExportConversation,
      ...((isHostChat || isVoiceRoute) ?
        {
          hostChat: {
            title: isVoiceRoute ? "Voicemode" : "Your Memento",
            subtitle: isHostChat ? hostChatSubtitle : undefined,
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
    handleOpenChatPreferences,
    handleExportConversation,
    setChrome,
    isHostChat,
    hostChatSubtitle,
    open,
    isVoiceRoute,
    voiceRouteMatch?.params?.id,
  ]);

  useEffect(() => () => setChrome(null), [setChrome]);

  if (isVoiceRoute && subscriptionLoading) {
    return <Loader />;
  }

  if (isVoiceRoute && !canAccess("voice_mode")) {
    return <VoiceModePaywall conversationId={id} />;
  }

  if ((loadingMemory || loadingPrompt) && !isVoiceRoute) {
    return <Loader />
  }
  const isTyping = isSending || startingConversation;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 items-stretch overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
        <div
          className="hide-scrollbar mx-auto flex h-full min-h-0 w-full min-w-0 max-w-[800px] flex-col overflow-y-auto overscroll-y-contain px-3 sm:px-4 md:px-5"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {isHostChat ? (
            <div
              className={cn(
                "sticky top-0 z-[5] flex w-full min-w-0 flex-col gap-2 border-b border-v3-stroke-weak/50 bg-white/95 py-2 backdrop-blur-md",
                "sm:flex-row sm:flex-nowrap sm:items-center sm:gap-2 sm:overflow-x-auto",
                "[scrollbar-width:thin] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:h-1.5",
              )}
              role="toolbar"
              aria-label="Host chat tools"
            >
              <div
                className={cn(
                  "min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]",
                  "empty:hidden sm:w-auto sm:shrink-0 sm:overflow-visible",
                )}
              >
                <HostChatJumpPills
                  monthKeys={jumpMonthKeys}
                  onJump={jumpToMonth}
                  categoryPills={enrichmentStats?.jump_pills}
                  onCategoryPill={(starter) => handleSend({ text: starter, attachments: [] })}
                />
              </div>
              <div
                className={cn(
                  "flex min-w-0 flex-wrap content-start items-center gap-2",
                  "sm:flex-nowrap sm:overflow-x-auto sm:pb-0",
                )}
              >
                {chatMode === "deep_dive" && deepDiveDimension ? (
                  <DeepDiveBanner
                    dimensionLabel={dimensionLabel(deepDiveDimension)}
                    onExit={handleExitDeepDive}
                  />
                ) : null}
                <MilestoneCard
                  enrichmentDelta={sessionEnrichmentDelta}
                  milestoneLabel={milestoneJustReached ? enrichmentStats?.milestone?.reached_label : null}
                />
                {showDeepDiveNudge ? (
                  <DeepDiveNudge
                    dimension={activeDimension}
                    question={nudgeQuestion}
                    onDeepDive={handleStartDeepDiveFromNudge}
                    onDismiss={handleDismissNudge}
                  />
                ) : null}
              </div>
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
              aiMessage.trim() ?
                <TypingBubble
                  text={aiMessage}
                  streamDone={streamDone}
                  onFinish={handleOnFinishTyping}
                  modelLabel={streamModelLabel}
                /> :
                <Bubble
                  role="ai"
                  text={aiMessage}
                  modelLabel={streamModelLabel}
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
          <div className="sticky bottom-0 z-[4] bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
            <div className="w-full">
              <ConversationChatinput
                key={`chat-draft-${memory?._id ?? id}`}
                loading={isTyping}
                onStop={handleStop}
                onSend={handleSend}
                history={messages.slice(-20).map(({ role, text }) => ({ role, text }))}
                inputClassName="!text-sm sm:!text-lg md:!text-xl"
                memoryId={
                  memory?._id ??
                  (id && id !== "new" ? id : null)
                }
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
          desktopLayout="inline"
          source={type === "prompt" ? "prompt" : "conversation"}
          quickActions={{
            onViewFullDetails: () => push("view-memory-details", { memory }),
            onEditMemory: () => push("edit-memory", { memory }),
            onExportConversation: handleExportConversation,
            onDelete: () => push("delete-memory", { memory }),
          }}
          enableChatPreferencesTab
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          enrichmentScore={enrichmentStats?.enrichment_score ?? 5}
          deltaToday={deltaToday}
          categoryScores={enrichmentStats?.category_scores}
        />
      }
    </div>
  );
}
