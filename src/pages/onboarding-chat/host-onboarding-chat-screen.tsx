"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUp, Mic, Plus } from "lucide-react";
import { Button, Card, Label, TextArea } from "@heroui/react";
import Logo from "@/components/logo";
import { skipOnboarding } from "@/api/onboarding";
import {
  buildIntroHeadline,
  DEFAULT_INTRO_REPLY,
  INTRO_SUBCOPY,
} from "@/features/host-onboarding-chat/scripted-exchanges";
import { useIntroSpeechDictation } from "@/features/host-onboarding-chat/use-intro-speech-dictation";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import chatAiOrbVideo from "@/assets/image/AI orb.mp4";
import {
  clearHostOnboardingChatState,
  useHostOnboardingChat,
  useHostOnboardingChatFieldIds,
} from "@/features/host-onboarding-chat/use-host-onboarding-chat";

const chipButtonV3 =
  "font-inter h-8 shrink-0 rounded-full border border-v3-stroke-weak bg-v3-fill-weaker px-3 text-xs font-medium text-v3-text-strong hover:bg-v3-stroke-weak/20 data-[disabled]:opacity-40";

const INTRO_TEXTAREA_MAX_HEIGHT_PX = 320;

const introTextAreaClass =
  "min-h-[1.75rem] w-full max-h-[320px] resize-none overflow-x-hidden border-0 bg-transparent px-0 py-1 font-garamond text-lg leading-normal text-v3-text-strong shadow-none outline-none ring-0 placeholder:text-v3-text-weaker data-focus-visible:ring-0";

function useAutosizeTextarea(
  value: string,
  enabled: boolean,
  maxHeightPx: number
) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const fullScrollHeight = el.scrollHeight;
    const target = Math.min(fullScrollHeight, maxHeightPx);
    el.style.height = `${target}px`;
    el.style.overflowY =
      fullScrollHeight > maxHeightPx ? "auto" : "hidden";
  }, [enabled, maxHeightPx, value]);

  return ref;
}

function BubbleMessageText({ content }: { content: string }) {
  return (
    <p className="break-words whitespace-pre-wrap font-inter text-sm leading-relaxed text-v3-text-strong">
      {content}
    </p>
  );
}

function chatBubbleCardClass(role: "assistant" | "user") {
  return cn(
    "shrink-0 w-fit max-w-[75%] min-w-0",
    role === "assistant"
      ? "self-start !rounded-none border-0 !bg-transparent !p-0 shadow-none"
      : "self-end rounded-lg border border-v3-stroke-weak bg-v3-fill-weak px-2 py-1 shadow-none"
  );
}

function chatBubbleContentClass() {
  return "!gap-0 !p-0";
}

function AiOrbBadge({ size }: { size: 40 | 60 }) {
  const dim = size === 60 ? "size-[60px]" : "size-[40px]";
  const shadow =
    size === 60
      ? "shadow-[0_0_20px_14px_rgba(255,255,255,0.55),0_0_6px_2px_rgba(255,255,255,0.35)]"
      : "shadow-[0_0_10px_6px_rgba(255,255,255,0.48),0_0_3px_1px_rgba(255,255,255,0.28)]";
  return (
    <div
      className={cn("relative shrink-0 rounded-full", dim, shadow)}
      aria-hidden
    >
      <video
        src={chatAiOrbVideo}
        className="relative z-0 block size-full rounded-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-full bg-[radial-gradient(circle_at_center,transparent_40%,rgba(255,255,255,0.22)_65%,rgba(255,255,255,0.9)_100%)]"
        aria-hidden
      />
    </div>
  );
}

export interface HostOnboardingChatScreenProps {
  /** Pause before each stream request (ms). Default 0. */
  assistantPreDelayMs?: number;
  persist?: boolean;
  nickname?: string;
}

export default function HostOnboardingChatScreen({
  assistantPreDelayMs,
  persist,
  nickname: nicknameProp,
}: HostOnboardingChatScreenProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, hydrated } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { composerId, introComposerId } = useHostOnboardingChatFieldIds();

  const stateNickname =
    (location.state as { nickname?: string } | null)?.nickname?.trim() ?? "";
  const displayNickname =
    nicknameProp?.trim() ||
    stateNickname ||
    user?.nickname?.trim() ||
    "";

  useEffect(() => {
    if (!persist) return;
    if (!hydrated) return;
    if (!user) return;
    if (!displayNickname) {
      navigate("/onboard", { replace: true });
    }
  }, [persist, hydrated, user, displayNickname, navigate]);

  const {
    messages,
    streamingAssistantText,
    isTyping,
    isComplete,
    draft,
    setDraft,
    introAcknowledged,
    introDraft,
    setIntroDraft,
    submitIntro,
    script,
    submitUserTurn,
    appendChipToDraft,
    resetFlow,
    exchangeNumberDisplay,
    totalExchanges,
    showProgressDots,
  } = useHostOnboardingChat({
    assistantPreDelayMs,
    persist,
    nickname: displayNickname,
  });

  const showMainComposer =
    introAcknowledged &&
    !isComplete &&
    !isTyping &&
    !streamingAssistantText.trim();
  const showIntro = !introAcknowledged && !isComplete;

  const showChatOrbUnderTranscript =
    introAcknowledged &&
    !isComplete &&
    (isTyping ||
      Boolean(streamingAssistantText.trim()) ||
      (showMainComposer && messages.length > 0));

  const introTextareaRef = useAutosizeTextarea(
    introDraft,
    showIntro,
    INTRO_TEXTAREA_MAX_HEIGHT_PX
  );

  const mainComposerTextareaRef = useAutosizeTextarea(
    draft,
    showMainComposer,
    INTRO_TEXTAREA_MAX_HEIGHT_PX
  );

  const appendIntroDictation = useCallback(
    (phrase: string) => {
      setIntroDraft((prev) => {
        const chunk = phrase.trim();
        if (!chunk) return prev;
        const base = prev.trimEnd();
        return base ? `${base} ${chunk}` : chunk;
      });
    },
    [setIntroDraft]
  );

  const { isSupported: speechSupported, isListening, toggleListening } =
    useIntroSpeechDictation(appendIntroDictation, showIntro);

  const appendMainDictation = useCallback(
    (phrase: string) => {
      setDraft((prev) => {
        const chunk = phrase.trim();
        if (!chunk) return prev;
        const base = prev.trimEnd();
        return base ? `${base} ${chunk}` : chunk;
      });
    },
    [setDraft]
  );

  const {
    isSupported: mainSpeechSupported,
    isListening: mainIsListening,
    toggleListening: toggleMainListening,
  } = useIntroSpeechDictation(appendMainDictation, showMainComposer);

  const onIntroComposerKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      if (introDraft.trim()) submitIntro();
    },
    [introDraft, submitIntro]
  );

  const onMainComposerKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      if (draft.trim()) submitUserTurn();
    },
    [draft, submitUserTurn]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [
    messages,
    isTyping,
    isComplete,
    introAcknowledged,
    showMainComposer,
    streamingAssistantText,
    showChatOrbUnderTranscript,
  ]);

  const handleSkip = async () => {
    try {
      await skipOnboarding();
      if (user && setUser) {
        setUser({ ...user, onboarding_status: "skipped" });
      }
    } finally {
      navigate("/overview");
    }
  };

  const handleComplete = () => {
    clearHostOnboardingChatState();
    navigate("/overview");
  };

  const onSubmitMain = (e: React.FormEvent) => {
    e.preventDefault();
    submitUserTurn();
  };

  const onSubmitIntro = (e: React.FormEvent) => {
    e.preventDefault();
    submitIntro();
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-v3-bg"
      role="main"
      aria-label="Onboarding chat"
    >
      <header className="flex shrink-0 items-center justify-between px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
        >
          <Logo />
        </Link>
        {!isComplete && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              className="font-inter min-w-0 px-2 text-sm text-v3-text-weaker hover:bg-transparent hover:text-v3-text-strong"
              onPress={() => {
                resetFlow();
                navigate("/onboard", { replace: true });
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="font-inter min-w-0 px-2 text-sm text-v3-text-weaker hover:bg-transparent hover:text-v3-text-strong"
              onPress={() => void handleSkip()}
            >
              Skip for now →
            </Button>
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-v3-bg px-4 pb-8 pt-4 sm:px-6">
        <div
          className={cn(
            "mx-auto flex h-[750px] max-h-full min-h-0 w-full max-w-[500px] shrink-0 flex-col",
            "rounded-[32px] border border-v3-stroke-weak bg-v3-bg p-4",
            "shadow-[0_4px_28px_rgba(23,11,0,0.07)]"
          )}
        >
          {showIntro ? (
            <>
              <div className="flex shrink-0 flex-col items-center justify-start gap-3 pt-[120px]">
                <AiOrbBadge size={60} />
                <h1 className="max-w-[320px] text-center font-garamond text-2xl font-normal leading-tight text-v3-text-strong">
                  {buildIntroHeadline(displayNickname)}
                </h1>
                <p className="max-w-[300px] text-center font-inter text-xs leading-relaxed text-v3-text-weak">
                  {INTRO_SUBCOPY}
                </p>
              </div>
              <div className="min-h-4 flex-1" aria-hidden="true" />
              <form
                onSubmit={onSubmitIntro}
                className="flex w-full shrink-0 flex-col gap-0"
              >
                <Label
                  htmlFor={introComposerId}
                  className="sr-only font-inter text-sm font-medium text-v3-text-strong"
                >
                  Reply to continue
                </Label>
                <div className="rounded-[20px] border border-v3-stroke-weak bg-v3-fill-weaker p-3">
                  <TextArea
                    ref={introTextareaRef}
                    id={introComposerId}
                    name="onboarding-intro-reply"
                    rows={1}
                    value={introDraft}
                    onChange={(e) => setIntroDraft(e.target.value)}
                    onKeyDown={onIntroComposerKeyDown}
                    placeholder={DEFAULT_INTRO_REPLY}
                    fullWidth
                    className={introTextAreaClass}
                  />
                  <div className="flex items-center justify-between pt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label="Add"
                      isDisabled
                      className="size-10 min-w-10 rounded-xl border border-v3-stroke-weak bg-v3-bg p-0 shadow-none"
                    >
                      <Plus className="mx-auto size-5 text-v3-text-strong" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        aria-label={
                          speechSupported
                            ? isListening
                              ? "Stop recording"
                              : "Record voice"
                            : "Voice input not supported in this browser"
                        }
                        aria-pressed={speechSupported ? isListening : undefined}
                        title={
                          speechSupported
                            ? undefined
                            : "Voice input is not available in this browser"
                        }
                        isDisabled={!speechSupported}
                        onPress={toggleListening}
                        className={cn(
                          "size-10 min-w-10 rounded-xl border border-v3-stroke-weak bg-v3-bg p-0 shadow-none",
                          isListening &&
                            "ring-2 ring-v3-brand-strong ring-offset-2 ring-offset-v3-fill-weaker"
                        )}
                      >
                        <Mic className="mx-auto size-5 text-v3-text-strong" />
                      </Button>
                      <Button
                        type="submit"
                        aria-label="Send"
                        isDisabled={!introDraft.trim()}
                        className="size-10 min-w-10 rounded-xl !bg-orange p-0 !text-white shadow-sm hover:!opacity-90 disabled:opacity-50"
                      >
                        <ArrowUp className="mx-auto size-5" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <>
              {introAcknowledged && !isComplete && showProgressDots && (
                <div
                  className="mb-3 flex shrink-0 flex-col items-center gap-2"
                  aria-label={`Onboarding progress, step ${exchangeNumberDisplay} of ${totalExchanges}`}
                >
                  <div className="flex gap-2" role="presentation">
                    {Array.from({ length: totalExchanges }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          i < exchangeNumberDisplay - 1
                            ? "bg-v3-brand-strong"
                            : i === exchangeNumberDisplay - 1
                              ? "bg-v3-text-strong"
                              : "bg-v3-stroke-weak"
                        )}
                      />
                    ))}
                  </div>
                  <p className="font-inter text-xs text-v3-text-weaker">
                    Step {exchangeNumberDisplay} of {totalExchanges}
                  </p>
                </div>
              )}

              <div
                ref={scrollRef}
                className="hide-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto pb-2"
              >
                <div className="flex w-full flex-col gap-3 py-1">
                  {messages.map((m) => (
                    <Card
                      key={m.id}
                      variant="transparent"
                      className={chatBubbleCardClass(
                        m.role === "assistant" ? "assistant" : "user"
                      )}
                    >
                      <Card.Content className={chatBubbleContentClass()}>
                        <BubbleMessageText content={m.content} />
                      </Card.Content>
                    </Card>
                  ))}
                  {streamingAssistantText.trim() ? (
                    <Card
                      variant="transparent"
                      className={chatBubbleCardClass("assistant")}
                    >
                      <Card.Content className={chatBubbleContentClass()}>
                        <BubbleMessageText content={streamingAssistantText} />
                      </Card.Content>
                    </Card>
                  ) : null}
                  {showChatOrbUnderTranscript && (
                    <div
                      className="flex w-full shrink-0 justify-start"
                      aria-live={
                        isTyping || streamingAssistantText.trim()
                          ? "polite"
                          : undefined
                      }
                      aria-busy={
                        isTyping || streamingAssistantText.trim()
                          ? true
                          : undefined
                      }
                    >
                      <AiOrbBadge size={40} />
                    </div>
                  )}
                </div>
              </div>

              {isComplete ? (
                <div className="mt-auto shrink-0 pt-1">
                  <div className="space-y-3">
                    <p className="font-inter text-sm text-v3-text-strong">
                      You&apos;re all set for this preview. Next we&apos;ll save
                      your intro for real once the backend is wired.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      className="font-inter rounded-full !bg-v3-brand-strong !text-white hover:!opacity-90"
                      onPress={handleComplete}
                    >
                      Go to dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto shrink-0 pt-1">
                  <form
                    onSubmit={onSubmitMain}
                    className="flex w-full shrink-0 flex-col gap-1"
                  >
                    {showMainComposer && (
                      <>
                        <div
                          className="hide-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch]"
                          role="group"
                          aria-label="Suggestions"
                        >
                          {script.suggestionChips.map((chip) => (
                            <Button
                              key={chip}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className={cn(chipButtonV3, "shrink-0")}
                              onPress={() => appendChipToDraft(chip)}
                            >
                              {chip}
                            </Button>
                          ))}
                        </div>
                        <div className="rounded-[20px] border border-v3-stroke-weak bg-v3-fill-weaker p-3">
                          <Label
                            htmlFor={composerId}
                            className="sr-only font-inter text-sm font-medium text-v3-text-strong"
                          >
                            {script.composerLabel}
                          </Label>
                          <TextArea
                            ref={mainComposerTextareaRef}
                            id={composerId}
                            name="onboarding-chat-reply"
                            rows={1}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onMainComposerKeyDown}
                            placeholder={script.composerPlaceholder}
                            fullWidth
                            className={introTextAreaClass}
                          />
                          <div className="flex items-center justify-between pt-3">
                            <Button
                              type="button"
                              variant="secondary"
                              aria-label="Add"
                              isDisabled
                              className="size-10 min-w-10 rounded-xl border border-v3-stroke-weak bg-v3-bg p-0 shadow-none"
                            >
                              <Plus className="mx-auto size-5 text-v3-text-strong" />
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                aria-label={
                                  mainSpeechSupported
                                    ? mainIsListening
                                      ? "Stop recording"
                                      : "Record voice"
                                    : "Voice input not supported in this browser"
                                }
                                aria-pressed={
                                  mainSpeechSupported
                                    ? mainIsListening
                                    : undefined
                                }
                                title={
                                  mainSpeechSupported
                                    ? undefined
                                    : "Voice input is not available in this browser"
                                }
                                isDisabled={!mainSpeechSupported}
                                onPress={toggleMainListening}
                                className={cn(
                                  "size-10 min-w-10 rounded-xl border border-v3-stroke-weak bg-v3-bg p-0 shadow-none",
                                  mainIsListening &&
                                    "ring-2 ring-v3-brand-strong ring-offset-2 ring-offset-v3-fill-weaker"
                                )}
                              >
                                <Mic className="mx-auto size-5 text-v3-text-strong" />
                              </Button>
                              <Button
                                type="submit"
                                aria-label="Send"
                                isDisabled={!draft.trim()}
                                className="size-10 min-w-10 rounded-xl !bg-orange p-0 !text-white shadow-sm hover:!opacity-90 disabled:opacity-50"
                              >
                                <ArrowUp
                                  className="mx-auto size-5"
                                  strokeWidth={2.5}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
