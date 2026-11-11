"use client";
import { VoiceAvatar } from "@/components/voice-avatar";
import type { VoiceMessage, VoiceRuntime } from "@/features/voice/types";

import voiceGridMask from "@/assets/icon/voice/grid-mask.svg";
import voiceGridVertical from "@/assets/icon/voice/grid-vertical.svg";
import voiceGridHorizontal from "@/assets/icon/voice/grid-horizontal.svg";
import voiceSettingsIcon from "@/assets/icon/voice/settings.svg";
import voiceMutedIcon from "@/assets/icon/voice/microphone-off.svg";
import voiceMicIcon from "@/assets/icon/voice/microphone.svg";
import voiceHangUpIcon from "@/assets/icon/voice/hang-up.svg";
import { VoiceBeam } from "voice-glow";
import { useAiPlaybackLevel } from "@/hooks/use-ai-playback-level";
import { useTheme } from "@/contexts/theme";
import { EndSessionDialog } from "./end-session-dialog";
import { RecordConversationsSetting } from "./record-conversations-setting";

import {
  AudioLines,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Settings2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { mutate } from "swr";
import { toast } from "sonner";
import phoneArtwork from "@/assets/image/voicemode phone.png";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormDialogContent } from "@/components/modal/form-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLiveAPI } from "@/hooks/use-live-api";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import {
  formatVoiceSessionTime,
  useVoiceModeVoices,
  type VoiceModeVoice,
} from "./voice-mode-voices";
import { useVoicePreviewClip } from "./use-voice-preview-clip";
import { VOICE_MENU_LAYER, VOICE_OVERLAY_LAYER, VOICE_SURFACE_LAYER } from "./voice-layers";

interface VoiceinputProps {
  connectionPersonId?: string;
  onCancel: () => void;
  onSessionChange?: (active: boolean) => void;
  autoStart?: boolean;
  inline?: boolean;
  variant?: "composer" | "overview" | "floating";
  persistent?: boolean;
  onRuntime?: (runtime: VoiceRuntime | null) => void;
  onMessages?: (messages: VoiceMessage[]) => void;
  onAutoStartConsumed?: () => void;
  memoryId?: string | null;
  history?: { role: "user" | "ai"; text: string }[];
}

type VoicePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voices: VoiceModeVoice[];
  initialVoice: VoiceModeVoice | null;
  isSaving: boolean;
  onSelect: (voice: VoiceModeVoice) => Promise<void>;
};

const VOICE_LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "zh-CN", label: "Mandarin Chinese" },
  { code: "hi-IN", label: "Hindi" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "ar-SA", label: "Arabic" },
  { code: "bn-BD", label: "Bengali" },
] as const;

type VoiceLanguageCode = (typeof VOICE_LANGUAGES)[number]["code"];

function VoiceArtwork({ voice, className }: { voice: VoiceModeVoice | null; className?: string }) {
  return voice ? (
    <VoiceAvatar artwork={voice.artwork} title={voice.title} className={cn("size-32", className)} />
  ) : (
    <div className={cn("size-32 rounded-full bg-fill-neutral-weak", className)} aria-hidden />
  );
}

function SmileBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 13.5s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

const VOICE_INTRO_BENEFITS = [
  { Icon: SmileBubbleIcon, title: "Intelligent, natural conversations", description: "Senses & responds to interruptions, humour, etc" },
  { Icon: CircleUserRound, title: "Personalized for you", description: "Uses memory & custom instructions to shape responses" },
  { Icon: AudioLines, title: "You’re in control", description: "Audio recordings are transcribed to the chat." },
];

function VoicePicker({
  open,
  onOpenChange,
  voices,
  initialVoice,
  isSaving,
  onSelect,
}: VoicePickerProps) {
  const initialIndex = Math.max(
    0,
    voices.findIndex((voice) => voice.voiceName === initialVoice?.voiceName),
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeVoice = voices[activeIndex] || initialVoice;
  const activeVoiceId = activeVoice?.id;
  const { play, stop, failed } = useVoicePreviewClip();

  // React applies a click's update before the click ends, so this keeps the tap's
  // permission to play sound when the user opens the picker or moves between voices.
  useEffect(() => {
    if (open && activeVoiceId) play(activeVoiceId);
    else stop();
  }, [activeVoiceId, open, play, stop]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(
      Math.max(
        0,
        voices.findIndex((voice) => voice.voiceName === initialVoice?.voiceName),
      ),
    );
  }, [initialVoice?.voiceName, open, voices]);

  const move = (direction: -1 | 1) => {
    if (voices.length < 2) return;
    setActiveIndex((current) => (current + direction + voices.length) % voices.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-voice-ignore=""
        showCloseButton={false}
        overlayClassName={cn(VOICE_OVERLAY_LAYER, "bg-overlay-backdrop")}
        className={cn(VOICE_SURFACE_LAYER, "max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background p-6 sm:max-w-[358px]")}
      >
        {/* Phone sheets reset min-height on the dialog itself, so the height lives here. */}
        <div className="grid min-h-[calc(60dvh-3rem)] grid-rows-[1fr_auto] gap-6 sm:min-h-[min(432px,calc(100dvh-6rem))]">
        <DialogHeader className="items-center justify-center gap-4 text-center">
          <DialogTitle className="sr-only">Choose a voice</DialogTitle>
          <DialogDescription className="sr-only">
            Step through the available voices and select one for your conversation.
          </DialogDescription>
          <div className="flex w-full items-center justify-between gap-6 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => move(-1)}
              disabled={voices.length < 2}
              aria-label="Previous voice"
            >
              <ChevronLeft />
            </Button>
            <button
              type="button"
              className="rounded-full outline-none transition-transform duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              disabled={!activeVoice}
              onClick={() => activeVoiceId && play(activeVoiceId)}
              aria-label={`Replay ${activeVoice?.title ?? "voice"} preview`}
            >
              <VoiceArtwork voice={activeVoice} className="size-40 sm:size-32" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={() => move(1)}
              disabled={voices.length < 2}
              aria-label="Next voice"
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="font-geist text-2xl font-semibold text-text-neutral-strong sm:text-xl">
              {activeVoice?.title || "Loading voices…"}
            </p>
            <p className="font-geist text-sm text-text-neutral-weak">
              {activeVoice?.metadata || "Voice catalog"}
            </p>
            <div className="flex items-center gap-2" aria-label={`${activeIndex + 1} of ${voices.length || 1}`}>
              {voices.slice(0, 6).map((voice, index) => (
                <span
                  key={voice.id}
                  className={cn(
                    "size-2 rounded-full",
                    index === activeIndex ? "bg-fill-brand-strong" : "bg-stroke-neutral-strong",
                  )}
                  aria-hidden
                />
              ))}
            </div>
            {failed ? (
              <p role="status" className="font-geist text-sm text-text-neutral-weak">
                Couldn’t play the sample. Tap the voice to try again.
              </p>
            ) : null}
          </div>
        </DialogHeader>
        <Button
          type="button"
          size="lg"
          className="w-full transition-transform duration-150 active:scale-[0.97]"
          disabled={!activeVoice || isSaving}
          onClick={() => activeVoice && void onSelect(activeVoice)}
        >
          {isSaving ? "Saving…" : "Select Voice"}
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type VoiceSettingsProps = {
  voices: VoiceModeVoice[];
  initialVoice: VoiceModeVoice | null;
  initialLanguage: VoiceLanguageCode;
  sessionActive: boolean;
  isSaving: boolean;
  onDismiss: () => void;
  onSave: (voice: VoiceModeVoice, language: VoiceLanguageCode) => Promise<void>;
  /** Only the host's own calls are recorded, not calls with a connection's Memento. */
  showRecording?: boolean;
};

function VoiceSettings({
  voices,
  initialVoice,
  initialLanguage,
  sessionActive,
  isSaving,
  onDismiss,
  onSave,
  showRecording = false,
  sheet = false,
}: VoiceSettingsProps & {
  /** Names the surrounding dialog; the anchored popover uses a plain heading. */
  sheet?: boolean;
}) {
  const [draftVoice, setDraftVoice] = useState<VoiceModeVoice | null>(initialVoice);
  const [draftLanguage, setDraftLanguage] = useState<VoiceLanguageCode>(initialLanguage);
  const Title = sheet ? DialogTitle : "h2";
  const Description = sheet ? DialogDescription : "p";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <Title className="font-geist text-base font-semibold text-text-neutral-strong">Settings</Title>
        <Description className="mt-1 font-geist text-sm font-normal text-text-neutral-weak">Customize your voice conversation.</Description>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-4" data-voice-settings-fields="">
      <div className="flex flex-col gap-2">
        <label htmlFor="voice-language" className="font-geist text-sm font-medium text-text-neutral-strong">
          Language
        </label>
        <Select value={draftLanguage} onValueChange={(value) => setDraftLanguage(value as VoiceLanguageCode)}>
          <SelectTrigger id="voice-language" aria-label="Language" className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-voice-ignore="" position="popper" align="end" className={VOICE_MENU_LAYER}>
            <SelectGroup>
              <SelectLabel>Conversation language</SelectLabel>
              {VOICE_LANGUAGES.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="font-geist text-xs font-normal leading-4 text-text-neutral-weak">
          {sessionActive ? "Changes apply immediately to your live session." : "Used for speech and transcripts."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-geist text-sm font-medium text-text-neutral-strong">Voice</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Voice">
          {voices.map((voice) => {
            const selected = draftVoice?.voiceName === voice.voiceName;
            return (
              <Button
                key={voice.id}
                type="button"
                variant="outline"
                className={cn(
                  "h-auto min-h-14 w-full justify-start gap-3 rounded-xl px-3 py-2 text-left transition-[transform,border-color] duration-150 active:scale-[0.98]",
                  selected && "border-stroke-brand-strong",
                )}
                role="radio"
                aria-checked={selected}
                onClick={() => setDraftVoice(voice)}
              >
                <VoiceArtwork voice={voice} className="size-9 shrink-0" />
                <span className="grid min-w-0 flex-1 text-left">
                  <span className="truncate font-geist text-sm font-semibold text-text-neutral-strong">{voice.title}</span>
                  <span className="truncate font-geist text-xs font-normal text-text-neutral-weak">{voice.metadata}</span>
                </span>
                {selected ? <CheckCircle2 className="text-text-brand-strong" aria-hidden /> : null}
              </Button>
            );
          })}
        </div>
      </div>
      {showRecording ? <RecordConversationsSetting /> : null}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-stroke-neutral-weak px-5 py-4">
        <Button type="button" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button
          type="button"
          disabled={!draftVoice || isSaving}
          onClick={() => draftVoice && void onSave(draftVoice, draftLanguage)}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/** A bottom sheet on phones, where a popover is too cramped; anchored to its button on desktop. */
function VoiceSettingsSurface({
  open,
  onOpenChange,
  trigger,
  settings,
  popoverClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  settings: VoiceSettingsProps;
  popoverClassName?: string;
}) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <FormDialogContent
          data-voice-ignore=""
          overlayClassName={VOICE_OVERLAY_LAYER}
          className={cn(VOICE_SURFACE_LAYER, "flex flex-col gap-0 overflow-hidden p-0")}
        >
          <VoiceSettings {...settings} sheet />
        </FormDialogContent>
      </Dialog>
    );
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        data-voice-ignore=""
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={16}
        aria-label="Voice settings"
        className={cn(
          VOICE_SURFACE_LAYER,
          "flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-80 flex-col gap-0 overflow-hidden p-0",
          popoverClassName,
        )}
      >
        <VoiceSettings {...settings} />
      </PopoverContent>
    </Popover>
  );
}

/** The conversation is being recorded and will be saved to Stories, as mobile's "Rec". */
function RecordingBadge({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-1.5 text-text-error-strong", className)}>
      <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-fill-error-strong motion-reduce:animate-none" />
      <span aria-hidden>Rec</span>
      <span className="sr-only">, recording to Stories</span>
    </span>
  );
}

export default function Voiceinput({ onCancel, connectionPersonId, memoryId, history = [], autoStart = false, onAutoStartConsumed, inline = false, variant = "composer", onSessionChange, persistent = false, onRuntime, onMessages }: VoiceinputProps) {
  const { user } = useStore();
  const [languageCode, setLanguageCode] = useState<VoiceLanguageCode>("en-US");
  const navigate = useNavigate();
  const { open: openModal } = useModal();
  // Voice tools act on this screen: open pages and modals, show a mute Memento
  // made, and hang up through the same path as the End call button.
  const voiceToolHandlers = useRef<{ setMuted?: (muted: boolean) => void; endCall?: () => void }>({});
  const toolControls = useMemo(() => ({
    navigate: (href: string) => navigate(href),
    openModal: (name: string) => openModal?.(name),
    setMuted: (muted: boolean) => voiceToolHandlers.current.setMuted?.(muted),
    endCall: () => voiceToolHandlers.current.endCall?.(),
    goBack: () => navigate(-1),
    // React Router keeps the position in history in state.idx.
    canGoBack: () => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0,
  }), [navigate, openModal]);
  const {
    connected,
    sendChatInput,
    audioPaused,
    resumeAudio,
    connect,
    startRecording,
    greet,
    stopRecording,
    disconnect,
    restartSession,
    setInputMuted,
    isRecording,
    isRecordingCall,
    reconnecting,
    thinking,
    error,
    outputNode,
  } = useLiveAPI({ connectionPersonId, memoryId, turns: history, languageCode, autoConnect: false, onMessages, toolControls });
  const aiLevel = useAiPlaybackLevel(outputNode);
  const { resolvedTheme } = useTheme();
  const autoStartAttempted = useRef(false);
  const catalog = useVoiceModeVoices();
  const { saveVoice, isSaving } = catalog;
  const voices = useMemo(() => persistent ? catalog.voices.filter(voice => voice.provider === "gemini") : catalog.voices, [persistent, catalog.voices]);
  const selectedVoice = persistent && catalog.selectedVoice?.provider !== "gemini" ? voices[0] ?? null : catalog.selectedVoice;
  useEffect(() => {
    onRuntime?.({ send: sendChatInput, ready: connected && isRecording });
    return () => onRuntime?.(null);
  }, [onRuntime, sendChatInput, connected, isRecording]);
  const [introOpen, setIntroOpen] = useState<boolean | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosenVoice, setChosenVoice] = useState<VoiceModeVoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [elevenLabsActive, setElevenLabsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const isElevenLabsProvider = (chosenVoice?.provider ?? user?.chat_voice_provider) === "elevenlabs";
  const sessionActive = isRecording || elevenLabsActive;
  const hadActiveSession = useRef(false);
  const interruptionHandled = useRef(false);
  const interrupted = inline && (variant === "overview" || persistent) &&
    !isStartingCall && !isDisconnecting && !sessionActive && !connected &&
    (Boolean(error) || hadActiveSession.current);
  useEffect(() => {
    if (sessionActive) hadActiveSession.current = true;
    if (!interrupted || interruptionHandled.current) return;
    interruptionHandled.current = true;
    toast.error("Voice conversation was interrupted. Please try again.");
    onCancel();
  }, [interrupted, sessionActive, onCancel]);
  const sessionObserver = useRef(onSessionChange);
  const reportedActive = useRef(false);
  useEffect(() => { sessionObserver.current = onSessionChange; }, [onSessionChange]);
  useEffect(() => {
    if (reportedActive.current === sessionActive) return;
    reportedActive.current = sessionActive;
    sessionObserver.current?.(sessionActive);
  }, [sessionActive]);
  useEffect(() => () => {
    if (reportedActive.current) sessionObserver.current?.(false);
    reportedActive.current = false;
  }, []);
  const elevenLabsTalkToUrl =
    import.meta.env.VITE_ELEVENLABS_TALK_TO_URL ||
    "https://elevenlabs.io/app/talk-to?agent_id=agent_1701kpzx5njhfxp991evy221ybnj&branch_id=agtbrch_0401kpzx5qmbf76rx7zbsrety678";

  useEffect(() => {
    if (!user || introOpen !== null) return;
    // `?voiceIntro` replays the first-time flow for an account that has already chosen a voice.
    const replayIntro = new URLSearchParams(window.location.search).has("voiceIntro");
    setIntroOpen(replayIntro || !user.chat_voice || (persistent && user.chat_voice_provider === "elevenlabs"));
  }, [introOpen, user, persistent]);

  useEffect(() => {
    if (!sessionActive) return;
    intervalRef.current = window.setInterval(() => {
      setRecordingTime((previous) => previous + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [sessionActive]);

  const handleStartCall = async () => {
    if (isStartingCall || sessionActive) return;
    setIsStartingCall(true);
    setMuted(false);
    setRecordingTime(0);
    try {
      if (isElevenLabsProvider) {
        setElevenLabsActive(true);
        return;
      }
      const ready = await connect(chosenVoice ? { voiceName: chosenVoice.voiceName } : undefined);
      if (ready === false) return;
      const recording = await startRecording();
      if (recording !== false && inline) await greet();
    } catch (startError) {
      console.error(startError);
      toast.error("Couldn’t start voice conversation. Please try again.");
      if (inline && (variant === "overview" || persistent)) onCancel();
    } finally {
      setIsStartingCall(false);
    }
  };

  const reportedVoiceError = useRef<string | null>(null);
  useEffect(() => {
    if (!error) { reportedVoiceError.current = null; return; }
    if (interrupted || reportedVoiceError.current === error) return;
    reportedVoiceError.current = error;
    toast.error(error);
  }, [error, interrupted]);

  useEffect(() => {
    if (!autoStart || autoStartAttempted.current || !user || introOpen !== false || pickerOpen) return;
    if (!isElevenLabsProvider && !outputNode) return;
    autoStartAttempted.current = true;
    onAutoStartConsumed?.();
    void handleStartCall();
    // One attempt per explicit Overview entry, after setup and the audio graph are ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, user, introOpen, pickerOpen, outputNode, isElevenLabsProvider, chosenVoice]);

  const toggleMute = () => {
    if (!sessionActive || isElevenLabsProvider) return;
    const nextMuted = !muted;
    setMuted(nextMuted);
    setInputMuted(nextMuted);
  };

  const handleEndCall = async () => {
    if (isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      setInputMuted(true);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      await stopRecording();
      if (connected) disconnect();
      setElevenLabsActive(false);
      onCancel();
    } catch (disconnectError) {
      console.error(disconnectError);
      toast.error("Couldn’t finish the voice session cleanly. Please try again.");
      onCancel();
    } finally {
      void mutate(`${endpoint.conversations}?page=1`);
      setIsDisconnecting(false);
    }
  };

  voiceToolHandlers.current = { setMuted, endCall: () => void handleEndCall() };

  const handleVoiceSelection = async (voice: VoiceModeVoice, close: "picker" | "settings") => {
    const saved = await saveVoice(voice);
    if (!saved) {
      toast.error("Failed to update voice settings");
      return;
    }
    if (close === "picker") {
      setChosenVoice(voice);
      setPickerOpen(false);
    }
    else setSettingsOpen(false);
  };

  const handleSettingsSave = async (voice: VoiceModeVoice, language: VoiceLanguageCode) => {
    const saved = await saveVoice(voice);
    if (!saved) {
      toast.error("Failed to update voice settings");
      return;
    }
    setChosenVoice(voice);
    setLanguageCode(language);
    setSettingsOpen(false);
    if (sessionActive && voice.provider === "gemini") {
      setMuted(false);
      await restartSession({
        languageCode: language,
        voiceName: voice.voiceName,
      });
    }
  };

  const statusText = useMemo(() => {
    if (!sessionActive) return "Ready when you are";
    if (isElevenLabsProvider) return "Live session";
    if (reconnecting) return "Reconnecting…";
    if (!connected) return "Connecting…";
    return thinking ? "Thinking…" : "Live session";
  }, [connected, isElevenLabsProvider, reconnecting, sessionActive, thinking]);

  const endConfirmation = <EndSessionDialog open={endDialogOpen} onOpenChange={setEndDialogOpen} duration={formatVoiceSessionTime(recordingTime)} ending={isDisconnecting} onConfirm={() => void handleEndCall()} />;

  const onboardingModals = (<>
      <Dialog open={introOpen === true} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent data-voice-ignore="" showCloseButton={false} overlayClassName={cn(VOICE_OVERLAY_LAYER, "bg-overlay-backdrop")} className={cn(VOICE_SURFACE_LAYER, "max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto bg-background p-0 sm:max-w-[358px]")}>
          <div className="flex h-[min(36dvh,320px)] items-center justify-center bg-gradient-to-b from-stroke-brand-weak to-transparent px-6 pt-6 sm:h-48 sm:pt-5 [border-radius:0_0_50%_50%/0_0_2rem_2rem]">
            <img src={phoneArtwork} alt="" className="h-full max-h-60 object-contain sm:max-h-36" />
          </div>
          <div className="flex flex-col gap-6 px-4 pb-6 pt-5 sm:gap-4 sm:p-5 sm:pt-3">
            <DialogHeader className="text-center">
              <DialogTitle className="font-geist text-2xl font-semibold text-text-neutral-strong sm:text-xl">Give Voicemode a Spin</DialogTitle>
              {persistent && user?.chat_voice_provider === "elevenlabs" ? (
                <DialogDescription className="text-text-neutral-weak">Choose an integrated voice to talk about texts and images in the same conversation.</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">A natural way to talk with Memento using the context you have already shared.</DialogDescription>
              )}
            </DialogHeader>
            <div className="mx-auto flex max-w-[300px] flex-col gap-4">
              {VOICE_INTRO_BENEFITS.map(({ Icon, title, description }) => (
                <div key={title} className="flex gap-2.5">
                  <Icon className="mt-0.5 size-5 shrink-0 text-text-brand-strong" aria-hidden />
                  <div>
                    <p className="font-geist text-sm font-semibold text-text-neutral-strong">{title}</p>
                    <p className="font-geist text-sm leading-5 text-text-neutral-weak">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:gap-2 sm:pt-0">
              <Button type="button" size="lg" className="h-13 sm:h-11" onClick={() => { setIntroOpen(false); setPickerOpen(true); }}>Choose a voice</Button>
              <Button type="button" variant="ghost" size="lg" className="h-13 bg-text-neutral-strong/6 sm:h-11 text-text-neutral-strong hover:bg-text-neutral-strong/10 dark:hover:bg-text-neutral-strong/10" onClick={onCancel}>Dismiss</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VoicePicker
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) onCancel();
        }}
        voices={voices}
        initialVoice={selectedVoice}
        isSaving={isSaving}
        onSelect={(voice) => handleVoiceSelection(voice, "picker")}
      />
  </>);

  if (interrupted) return null;

  const settingsProps: VoiceSettingsProps = {
    showRecording: !connectionPersonId,
    voices,
    initialVoice: selectedVoice,
    initialLanguage: languageCode,
    sessionActive,
    isSaving,
    onDismiss: () => setSettingsOpen(false),
    onSave: handleSettingsSave,
  };

  if (inline) {
    const overview = variant === "overview";
    const floating = variant === "floating";
    const callStatus = isStartingCall ? "Connecting…" : sessionActive
      ? (reconnecting ? "Reconnecting…" : audioPaused ? "Audio paused" : muted ? "You’re muted" : thinking ? "Thinking…" : "Listening") : "Ready to connect";
    const settings = (
      <VoiceSettingsSurface
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settingsProps}
        trigger={
          <Button type="button" variant="ghost" size="icon-lg" aria-label="Voice settings" className={floating ? "pointer-events-auto size-7 rounded-full text-icon-neutral-weak [&_svg]:size-4" : overview ? "size-12 rounded-full bg-fill-neutral-weak" : undefined}>
            {overview ? <img src={voiceSettingsIcon} alt="" className="dark:brightness-0 dark:invert dark:opacity-60" /> : floating ? <Settings2 /> : <Settings />}
          </Button>
        }
      />
    );
    const controls = (
      <div className={cn("flex items-center", floating ? "pointer-events-auto shrink-0 gap-3" : overview ? "gap-4" : "gap-2")}>
        <Button type="button" variant={overview || floating ? "ghost" : "outline"} size="icon-lg" className={overview || floating ? cn("rounded-full", floating ? "size-12 p-3" : "size-16 p-5", muted ? "bg-fill-tab-active hover:bg-fill-tab-active dark:hover:bg-fill-tab-active" : cn("bg-fill-neutral-weak text-icon-neutral-weak", floating && "border-stroke-neutral-weak dark:border-transparent")) : undefined} disabled={!sessionActive || isElevenLabsProvider} onClick={toggleMute} aria-label={muted ? "Unmute microphone" : "Mute microphone"} aria-pressed={muted}>
          {overview || floating ? <img src={muted ? voiceMutedIcon : voiceMicIcon} alt="" aria-hidden className={cn("shrink-0", muted ? "brightness-0 invert dark:invert-0" : "dark:brightness-0 dark:invert")} /> : muted ? <MicOff /> : <Mic className="text-icon-neutral-weaker" />}
        </Button>
        {!overview && !floating && settings}
        <Button type="button" variant={overview || floating ? "ghost" : "outline"} size="icon-lg" className={overview || floating ? cn("rounded-full bg-fill-error-weak text-icon-error-strong hover:bg-fill-error-weak/80 dark:hover:bg-fill-error-weak/80", floating ? "size-12 [&_svg]:size-5" : "size-16") : undefined} aria-label="End voice conversation" disabled={isDisconnecting} onClick={() => setEndDialogOpen(true)}>
          {overview ? <img src={voiceHangUpIcon} alt="" className="dark:brightness-150 dark:saturate-50" /> : <PhoneOff />}
        </Button>
      </div>
    );
    return (
      <>
      {onboardingModals}
      {endConfirmation}
      <VoiceBeam type="default" theme={resolvedTheme} colorVariant="sunset" level={aiLevel} idle={0} active={sessionActive && !isElevenLabsProvider} borderRadius={overview ? 24 : undefined} style={{ display: "block", width: "100%" }}>
        <section aria-label="Voice conversation" className={cn("relative isolate flex flex-col text-text-neutral-strong", overview ? "min-h-[178px] justify-between gap-[18px] overflow-hidden rounded-3xl border border-stroke-neutral-weaker bg-fill-neutral-weak p-6" : floating ? "max-h-[calc(100dvh-100px)] gap-3 overflow-y-auto rounded-3xl bg-popover bg-[linear-gradient(var(--fill-neutral-weak),var(--fill-neutral-weak))] p-5 max-sm:px-3 shadow-[0_20px_60px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25)] ring-1 ring-stroke-neutral-weak" : "min-h-[130px] justify-center gap-4 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak p-4")}>
          {floating ? <>
            <button type="button" data-voice-drag-handle aria-label="Move voice window" title="Drag to move. Use arrow keys when focused." className="absolute inset-0 -z-10 touch-none cursor-grab rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-neutral-strong active:cursor-grabbing" />
            {/* Lets drags on the artwork, text, and gaps reach the handle behind this row. */}
            <div className="pointer-events-none flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <VoiceArtwork voice={selectedVoice} className="size-12 shrink-0" />
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1">
                    <span aria-label="Call duration" className="font-geist text-lg font-bold tabular-nums">{formatVoiceSessionTime(recordingTime)}</span>
                    {settings}
                  </div>
                  <p role="status" className="flex items-center gap-2 font-geist text-sm text-text-neutral-weak"><span aria-hidden className={cn("size-2 shrink-0 rounded-full", muted ? "bg-fill-error-strong" : "bg-fill-success-strong")} />{callStatus}{isRecordingCall && <RecordingBadge />}</p>
                </div>
              </div>
              {controls}
            </div>
          </> : overview ? <>
            <div aria-hidden className="pointer-events-none absolute -top-[203px] left-1/2 -z-10 h-[573.383px] w-[764.51px] -translate-x-1/2 rotate-[6.45deg] opacity-20" style={{ maskImage: `url(${voiceGridMask})`, maskRepeat: "no-repeat", maskPosition: "240px 0" }}>
              <img src={voiceGridVertical} alt="" className="absolute left-0 top-0 max-w-none" />
              <img src={voiceGridHorizontal} alt="" className="absolute left-0 top-0 max-w-none" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span aria-label="Call duration" className="font-garamond text-[30px] leading-[34px] tabular-nums">{formatVoiceSessionTime(recordingTime)}</span>
                <p role="status" className="flex items-center gap-2 font-geist text-sm text-text-neutral-weak"><span aria-hidden className={cn("size-2 shrink-0 rounded-full", muted ? "bg-fill-error-strong" : sessionActive ? "bg-fill-success-strong" : "bg-fill-neutral-strong")} />{callStatus}{isRecordingCall && <RecordingBadge />}</p>
              </div>
              {settings}
            </div>
            {controls}
          </> : <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <VoiceArtwork voice={selectedVoice} className="size-12" />
              <div className="flex flex-col gap-1">
                <p className="font-inter text-sm font-semibold">{isStartingCall ? "Connecting…" : sessionActive ? "Let’s talk" : "Voice conversation"}</p>
                <p role="status" className="flex items-center gap-1 font-inter text-xs text-text-neutral-weak">{callStatus} · {formatVoiceSessionTime(recordingTime)}{isRecordingCall && <RecordingBadge />}</p>
              </div>
            </div>
            {controls}
          </div>}
          {sessionActive && audioPaused && <Button type="button" variant="outline" onClick={() => void resumeAudio()}>Enable audio</Button>}
          {!error && !sessionActive && !isStartingCall && introOpen === false && !pickerOpen && <Button type="button" variant="outline" className="self-start" onClick={() => void handleStartCall()}>Try again</Button>}
          {isElevenLabsProvider && elevenLabsActive && <iframe src={elevenLabsTalkToUrl} title="ElevenLabs Agent" className="h-[300px] w-full rounded-xl" allow="microphone; autoplay" />}
        </section>
      </VoiceBeam>
      </>
    );
  }

  if (!user || introOpen === null) {
    return createPortal(<div className="fixed inset-0 z-[200] bg-background" />, document.body);
  }

  return createPortal(
    <VoiceBeam
      type="mobile"
      theme={resolvedTheme}
      colorVariant="sunset"
      level={aiLevel}
      idle={0}
      active={sessionActive && !isElevenLabsProvider}
      className="fixed inset-0 z-[200]"
      style={{ position: "fixed", inset: 0, zIndex: 200, width: "100%", height: "100%" }}
    >
    <div className="flex h-full flex-col bg-background text-text-neutral-strong" data-testid="voice-mode-layer">
      <header className="flex shrink-0 items-start px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        {!sessionActive ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Exit
          </Button>
        ) : null}
        <div className="ml-auto">
          <VoiceSettingsSurface
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settings={settingsProps}
            popoverClassName="shadow-overlay-backdrop-dark"
            trigger={
              <Button type="button" variant="ghost" size="icon-lg" aria-label="Voice settings">
                <Settings />
              </Button>
            }
          />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center px-4 pb-20 pt-8 sm:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <VoiceArtwork voice={selectedVoice} className={cn("size-32", sessionActive && "ring-4 ring-fill-success-weak")} />
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-geist text-3xl font-semibold tabular-nums text-text-neutral-strong" aria-live="polite">
              {formatVoiceSessionTime(recordingTime)}
            </p>
            <p className="font-geist text-sm text-text-neutral-weak">
              {sessionActive ? (
                    <span className={cn("mr-2 inline-block size-2 rounded-full", muted ? "bg-fill-error-strong" : "bg-fill-success-strong")} aria-hidden />
              ) : null}
              {statusText}
              {isRecordingCall && <RecordingBadge className="ml-2 inline-flex" />}
            </p>
          </div>

          {isElevenLabsProvider && elevenLabsActive ? (
            <div className="w-full overflow-hidden rounded-2xl border border-stroke-neutral-weak bg-background">
              <iframe src={elevenLabsTalkToUrl} title="ElevenLabs Agent" className="h-[360px] w-full" allow="microphone; autoplay" />
            </div>
          ) : !sessionActive ? (
            <Button
              type="button"
              size="lg"
              onClick={() => void handleStartCall()}
              disabled={isStartingCall}
              className="min-w-48 transition-transform duration-150 active:scale-[0.97]"
            >
              {isStartingCall ? "Starting…" : "Start conversation"}
            </Button>
          ) : (
            <div className="flex items-center gap-4" data-testid="voice-session-controls">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className={cn(
                  "size-14 rounded-full transition-transform duration-150 active:scale-[0.97]",
                  muted && "border-stroke-error-strong text-text-error-strong",
                )}
                onClick={toggleMute}
                disabled={isElevenLabsProvider}
                aria-pressed={muted}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              >
                {muted ? <MicOff /> : <Mic />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="size-14 rounded-full bg-fill-error-weak text-text-error-strong transition-transform duration-150 hover:bg-fill-error-weak active:scale-[0.97]"
                onClick={() => setEndDialogOpen(true)}
                disabled={isDisconnecting}
                aria-label="End voice conversation"
              >
                <PhoneOff />
              </Button>
            </div>
          )}
        </div>
      </main>

      {onboardingModals}
      {endConfirmation}
    </div>
    </VoiceBeam>,
    document.body,
  );
}
