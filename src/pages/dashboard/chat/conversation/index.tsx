import {
  ConversationChatinput,
  type IOnSendPayload,
} from "@/components/Chatinput";
import Bubble, { Typing, TypingBubble } from "./bubble";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
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
import { useEnrichmentStats } from "@/features/enrichment";
import { useSubscription } from "@/contexts/subscription";
import { VoiceModePaywall } from "@/features/pricing/voice-mode-paywall";
import { ChatEmptyState } from "./chat-empty-state";
import type { ConversationFilesRequest } from "./conversation-assets";

type StreamlinePayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
  onMeta?: (meta: { model?: string }) => void;
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
  const [replyQuote, setReplyQuote] = useState<ChatReplyQuote | null>(null)
  const [streamDone, setStreamDone] = useState(false);

  const {
    stats: enrichmentStats,
    deltaToday,
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

  const hostChatSubtitle = useMemo(() => {
    if (!isHostChat || !memory?.created_at) return undefined;
    const since = dayjs(memory.created_at);
    const sinceLabel = since.isValid() ? since.format("MMM D, YYYY") : "";
    return sinceLabel ? `Active since ${sinceLabel}` : undefined;
  }, [isHostChat, memory?.created_at]);

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

  const handleToggleSettingsDrawer = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleOpenConversationFiles = useCallback(
    ({ tab, mediaFilter }: ConversationFilesRequest) => {
      if (!memory?._id) return;
      push?.("conversation-files", {
        conversationId: memory._id,
        messages,
        initialTab: tab,
        initialMediaFilter: mediaFilter,
      });
    },
    [memory?._id, messages, push],
  );

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
      scrollToBottom,
      sendMessage,
      handleChuckArrival,
      startConversation,
      handleOnFinishTyping,
      navigate,
    ],
  );

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
          onOpenChatPreferences: undefined,
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
      onOpenChatPreferences: memory?._id ? handleToggleSettingsDrawer : undefined,
      ...((isHostChat || isVoiceRoute) ?
        {
          hostChat: {
            title: isVoiceRoute ? "Voicemode" : "Chat",
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
    handleToggleSettingsDrawer,
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
          className="hide-scrollbar mx-auto flex h-full min-h-0 w-full min-w-0 max-w-[900px] flex-col overflow-y-auto overscroll-y-contain px-3 sm:px-4 md:px-5"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {isNew && messages.length === 0 && !isTyping ? (
            <ChatEmptyState
              onPrompt={(text) => handleSend({ text, attachments: [] })}
            />
          ) : (
          <History
            {...{
              memory,
              messages,
              setMessages,
              scrollContainerRef,
              onViewDetails: handleToggleSettingsDrawer,
              onRetryFailedMessage: handleRetryFailedMessage,
              onReplyToMessage: handleReplyToMessage,
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
          )}
          <div className="sticky bottom-0 z-[4] bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
            <div className="w-full">
              <ConversationChatinput
                key={`chat-draft-${memory?._id ?? id}`}
                loading={isTyping}
                onStop={handleStop}
                onSend={handleSend}
                history={messages.slice(-20).map(({ role, text }) => ({ role, text }))}
                inputClassName="!text-sm sm:!text-base"
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
          desktopLayout="overlay"
          source={type === "prompt" ? "prompt" : "conversation"}
          quickActions={{
            onViewFullDetails: () => push("view-memory-details", { memory }),
            onEditMemory: () => push("edit-memory", { memory }),
            onExportConversation: handleExportConversation,
            onDelete: () => push("delete-memory", { memory }),
          }}
          includeChatPreferences
          enrichmentScore={enrichmentStats?.enrichment_score ?? 5}
          deltaToday={deltaToday}
          categoryScores={enrichmentStats?.category_scores}
          onOpenConversationFiles={handleOpenConversationFiles}
        />
      }
    </div>
  );
}
