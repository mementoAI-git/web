import { CHAT_CONTENT_LAYOUT, CHAT_CONTENT_INSET, CHAT_COMPOSER_LAYOUT, CHAT_COMPOSER_FOOTER, CHAT_SCROLL_LAYOUT, CHAT_WIDTH_WITH_SETTINGS_OPEN } from "./chat-layout";
import ReflectionLoading from "../reflection-loading";
import type {ReflectionEntry} from "@/lib/reflection-entry";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useSpokenReplies } from "@/hooks/use-spoken-replies";
import { useVoiceSession } from "@/contexts/voice-session";
import type { VoiceSessionEvent } from "./voice-session-divider";
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
import { useConversationFileCount } from "@/components/modal/chat-settings/use-conversation-file-count";
import { type IMessage } from "@/utility/interface";
import Loader from "./loader";
import useSWRMutation from "swr/mutation";
import { streamlineFetcher } from "@/api/fetcher";
import { toast } from "sonner";
import SidebarDetails from "@/components/memory/sidebar-details";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
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
import posthog from "@/lib/posthog";

type StreamlinePayload = {
  text: string;
  attachments: string[];
  memory: string;
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
  onMeta?: (meta: { model?: string }) => void;
  onStatus?: (status: string) => void;
};

export default function Conversation(props: { id: string; type?: "memory" | "prompt" | "reflection"; reflectionEntry?: ReflectionEntry }) {
  return <ConversationSession key={`${props.type ?? "memory"}:${props.id}`} {...props} />;
}

function ConversationSession({ id, type = "memory", reflectionEntry }: { id: string; type?: "memory" | "prompt" | "reflection"; reflectionEntry?: ReflectionEntry }) {
  const [aiMessage, setAiMessage] = useState("")
  const [streamModelLabel, setStreamModelLabel] = useState<string | undefined>(undefined);
  const abortCtrl = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const mounted = useRef(true);
  const interrupted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; abortCtrl.current?.abort(); };
  }, []);
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true);
  const isNew = id === "new";
  const isTopic = type === "prompt" || type === "reflection";
  const isHostChat = type === "memory" && !isNew;
  const { setHeaderTitle } = useStore();
  const { setChrome } = useConversationChrome();
  const { open, push } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const discussionHandled = useRef<string | null>(null);
  const voiceRouteMatch = useMatch({ path: "/chat/:id/voice", end: true });
  const isVoiceRoute = Boolean(voiceRouteMatch);
  const { canAccess, isLoading: subscriptionLoading } = useSubscription();
  const [messages, setMessages] = useState<Partial<IMessage>[]>([])
  const voiceSession = useVoiceSession();
  const { enabled: spokenRepliesEnabled, supported: spokenRepliesSupported, isLoading: spokenRepliesLoading, toggle: toggleSpokenReplies, speak: speakReply, stream: streamReply, stop: stopSpokenReply } = useSpokenReplies(id, isVoiceRoute || Boolean(voiceSession?.active));
  const [voiceEvents, setVoiceEvents] = useState<VoiceSessionEvent[]>([]);
  const handleVoiceSessionChange = useCallback((active: boolean) => {
    setVoiceEvents(previous => {
      if ((previous.at(-1)?.active ?? false) === active) return previous;
      return [...previous, { id: crypto.randomUUID(), active, afterMessage: messages.at(-1) ?? null }];
    });
  }, [messages]);
  useEffect(() => { setVoiceEvents([]); }, [id]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar closed by default
  const [replyQuote, setReplyQuote] = useState<ChatReplyQuote | null>(null)
  const [streamDone, setStreamDone] = useState(false);
  /** What Memento says it is doing before the reply starts. */
  const [replyStatus, setReplyStatus] = useState<string>();
  const speechStreamText = useRef("");

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

  const { data: memoryData, isLoading: loadingMemory, error: memoryError, mutate: refreshMemory } = useSWR(
    id && type !== "prompt" && !isNew ? `${endpoint.memories}/${id}` : null
  );
  const { data: promptData, isLoading: loadingPrompt, error: promptError, mutate: refreshPrompt } = useSWR(
    id && type === "prompt" && !isNew ?
      `${endpoint.memoryPrompt}/${id}` :
      null
  );

  const detailError = type === "prompt" ? promptError : memoryError;
  const retryDetail = useRequestRecovery(`conversation:${type}:${id}`, detailError, type === "prompt" ? refreshPrompt : refreshMemory, "This conversation couldn’t be loaded. Try again.");

  const { trigger: startConversation, isMutating: startingConversation } = useFetcher(endpoint.startConversation)

  const memory = useMemo(() => memoryData?.data || promptData?.data, [promptData, memoryData]);
  const liveTimeline = useMemo(() => voiceSession?.timeline.filter(entry => !entry.connectionPersonId && (entry.memoryId === id || (memory?._id && entry.memoryId === memory._id) || (id === "new" && entry.memoryId === voiceSession.memoryId))) ?? [], [voiceSession?.timeline, voiceSession?.memoryId, id, memory?._id]);

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

  useEffect(() => { if (liveTimeline.length) scrollToBottom(); }, [liveTimeline.length, scrollToBottom]);

  // Close sidebar handler
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleToggleSettingsDrawer = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const { fileCount: conversationFileCount, knownMessages } = useConversationFileCount(memory?._id, messages, isSidebarOpen);

  const handleOpenConversationFiles = useCallback(
    ({ tab, mediaFilter }: ConversationFilesRequest) => {
      push?.("conversation-files", {
        conversationId: memory?._id,
        messages: knownMessages,
        initialTab: tab,
        initialMediaFilter: mediaFilter,
      });
    },
    [memory?._id, knownMessages, push],
  );

  const handleChuckArrival = useCallback((chunk: string) => {
    if (chunk.trim().startsWith("ERROR: ")) {
      throw new Error("The response was interrupted. Please retry.");
    }

    if (typeof chunk === 'string' && chunk !== '') {
      const previous = speechStreamText.current;
      const next = previous && chunk.length > previous.length && chunk.startsWith(previous) ? chunk : previous + chunk;
      speechStreamText.current = next;
      setAiMessage(next);
      streamReply?.(next);

      scrollToBottom();
    }
  }, [scrollToBottom, streamReply]);

  const handleOnFinishTyping = useCallback((text: string) => {
    if (text && text.trim()) {
      // Streamed speech is already queued and flushed at transport completion.
      if (!interrupted.current && !speechStreamText.current) speakReply(text);
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
    void mutate(endpoint.userStats).catch(() => undefined);
    // The reply may have remembered or forgotten something.
    void mutate(endpoint.personaObservations).catch(() => undefined);
  }, [streamModelLabel, speakReply]);

  const sendChatMessage = useCallback(
    async (
      { text, attachments = [], replyTo }: IOnSendPayload,
      options: { appendUserMessage: boolean },
    ) => {
      if (sendingRef.current || (!text.trim() && attachments.length === 0)) return;
      sendingRef.current = true;
      interrupted.current = false;
      stopSpokenReply();
      speechStreamText.current = "";
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
          const controller = new AbortController();
          abortCtrl.current = controller;
          setStreamDone(false);
          setStreamModelLabel(undefined);
          setReplyStatus(undefined);

          await sendMessage({
            text: apiText,
            attachments: attachments.map((a) => a._id),
            memory: memory?._id,
            signal: controller.signal,
            onChunk: (chunk) => { if (mounted.current && !controller.signal.aborted) handleChuckArrival(chunk); },
            onMeta: ({ model }) => { if (mounted.current && !controller.signal.aborted) setStreamModelLabel(model); },
            onStatus: (status) => { if (mounted.current && !controller.signal.aborted) setReplyStatus(status); },
          })
          if (posthog.__loaded) {
            posthog.capture("chat_message_sent", {
              conversation_type: type,
              is_new_conversation: false,
              attachment_count: attachments.length,
              has_reply_quote: Boolean(replyTo),
            });
          }
          if (mounted.current) {
            streamReply?.(speechStreamText.current, true);
            setStreamDone(true);
          }
          return;
        }

        const result = await startConversation({
          text: apiText,
          ...(attachments.length ? { attachments: attachments.map((attachment) => attachment._id) } : {}),
        })

        if (!mounted.current) return;
        if (!result?.data?.response || !result?.data?.memory_id) throw new Error("Your chat could not be opened. Please retry.");
        if (result?.data?.response) {
          if (posthog.__loaded) {
            posthog.capture("chat_message_sent", {
              conversation_type: type,
              is_new_conversation: true,
              attachment_count: attachments.length,
              has_reply_quote: Boolean(replyTo),
            });
          }
          handleOnFinishTyping(result?.data?.response)
          // Invalidate profile so primary_conversation_id is fresh
          void mutate(endpoint.profile).catch(() => undefined)
          navigate(`/chat/${result?.data?.memory_id}`, { replace: true })
        }

      } catch (error: unknown) {
        if (!mounted.current) return;
        interrupted.current = true;
        stopSpokenReply();
        const errName = error instanceof Error ? error.name : "";
        if (errName !== "AbortError") {
          reportFetcherError(error, "Failed to send message");
          setMessages((previous) => {
            const next = [...previous];
            for (let index = next.length - 1; index >= 0; index--) {
              if (next[index]?.role === "user" && next[index]?.text === text) {
                next[index] = { ...next[index], sendFailed: true };
                break;
              }
            }
            return next;
          });
        }
        setStreamDone(true);
      } finally {
        abortCtrl.current = null;
        sendingRef.current = false;
      }
    },
    [
      aiMessage,
      stopSpokenReply,
      streamReply,
      memory?._id,
      scrollToBottom,
      sendMessage,
      handleChuckArrival,
      startConversation,
      handleOnFinishTyping,
      navigate,
      type,
    ],
  );

  const handleSend = useCallback(
    (payload: IOnSendPayload) => {
      void sendChatMessage(payload, { appendUserMessage: true });
    },
    [sendChatMessage],
  );

  useEffect(() => {
    const text = location.state?.overviewDiscussion;
    if (typeof text !== "string" || !text.trim() || discussionHandled.current === location.key) return;
    if (loadingMemory || loadingPrompt || (!isNew && !memory?._id)) return;
    discussionHandled.current = location.key;
    const remainingState = { ...location.state };
    delete remainingState.overviewDiscussion;
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: remainingState });
    handleSend({ text, attachments: [] });
  }, [location, loadingMemory, loadingPrompt, isNew, memory?._id, navigate, handleSend]);

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
    if (sendingRef.current) return;
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
    interrupted.current = true;
    stopSpokenReply();
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
      setHeaderTitle(isTopic ? "Reflection" : memory?.title || "New conversation");
    }
    return () => {
      setHeaderTitle(null);
    };
  }, [isHostChat, isTopic, memory?.title, setHeaderTitle]);

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
      onOpenChatPreferences: handleToggleSettingsDrawer,
      spokenReplies: { enabled: spokenRepliesEnabled, isLoading: spokenRepliesLoading, supported: spokenRepliesSupported, onToggle: toggleSpokenReplies },
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
    spokenRepliesEnabled,
    spokenRepliesLoading,
    spokenRepliesSupported,
    toggleSpokenReplies,
    setChrome,
    isHostChat,
    hostChatSubtitle,
    open,
    isVoiceRoute,
    voiceRouteMatch?.params?.id,
  ]);

  useEffect(() => () => setChrome(null), [setChrome]);

  if (isVoiceRoute && subscriptionLoading) {
    return type === "reflection" && reflectionEntry ? <ReflectionLoading entry={reflectionEntry} /> : <Loader />;
  }

  if (isVoiceRoute && !canAccess("voice_mode")) {
    return <VoiceModePaywall conversationId={id} />;
  }

  if ((loadingMemory || loadingPrompt) && !isVoiceRoute) {
    return <Loader />
  }
  if (!isNew && detailError && !memory?._id) {
    return <div className="flex flex-1 items-center justify-center"><Button variant="outline" onClick={retryDetail}>Retry loading conversation</Button></div>;
  }
  const isTyping = isSending || startingConversation;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 items-stretch overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-hidden">
        <div
          className={CHAT_SCROLL_LAYOUT}
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div className={cn(CHAT_CONTENT_LAYOUT, isSidebarOpen && CHAT_WIDTH_WITH_SETTINGS_OPEN, isTopic ? "px-3 pt-3 sm:px-0" : CHAT_CONTENT_INSET)}>
          {isNew && messages.length === 0 && voiceEvents.length === 0 && liveTimeline.length === 0 && !isTyping ? (
            <ChatEmptyState
              onPrompt={(text) => handleSend({ text, attachments: [] })}
            />
          ) : (
          <History
            key={memory?._id ?? id}
            {...{
              memory,
              messages,
              voiceEvents,
              liveTimeline,
              setMessages,
              scrollContainerRef,
              onViewDetails: handleToggleSettingsDrawer,
              onRetryFailedMessage: handleRetryFailedMessage,
              onReplyToMessage: handleReplyToMessage,
            }}
          >
            {(isTyping && isEmpty(aiMessage)) ?
              <Typing status={replyStatus} /> :
              aiMessage.trim() ?
                <TypingBubble
                  topic={isTopic}
                  text={aiMessage}
                  streamDone={streamDone}
                  onFinish={handleOnFinishTyping}
                  modelLabel={streamModelLabel}
                /> :
                <Bubble
                  topic={isTopic}
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
          </div>
          <div className={cn(CHAT_COMPOSER_FOOTER, isTopic ? "pt-2" : "pt-1")}>
            <div className={cn(CHAT_COMPOSER_LAYOUT, isSidebarOpen && CHAT_WIDTH_WITH_SETTINGS_OPEN, isTopic ? "px-7" : "px-3")}>
              <ConversationChatinput
                key={`chat-draft-${memory?._id ?? id}`}
                onVoiceSessionChange={handleVoiceSessionChange}
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
        // A new chat has no conversation yet, but its preferences still apply.
        <SidebarDetails
          memory={memory?._id ? memory : undefined}
          onClose={handleCloseSidebar}
          isOpen={isSidebarOpen}
          desktopLayout="inline"
          source={type === "prompt" ? "prompt" : "conversation"}
          quickActions={memory?._id ? {
            onViewFullDetails: () => push("view-memory-details", { memory }),
            onEditMemory: () => push("edit-memory", { memory }),
            onExportConversation: handleExportConversation,
            onDelete: () => push("delete-memory", { memory }),
          } : undefined}
          includeChatPreferences
          enrichmentScore={enrichmentStats?.enrichment_score}
          deltaToday={deltaToday}
          categoryScores={enrichmentStats?.category_scores}
          onOpenConversationFiles={handleOpenConversationFiles}
          conversationFileCount={conversationFileCount}
        />
      }
    </div>
  );
}
