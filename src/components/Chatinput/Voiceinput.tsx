"use client";
import { VoiceAvatar } from "@/components/voice-avatar";
import type { VoiceMessage, VoiceRuntime } from "@/features/voice/types";

import voiceGridMask from "@/assets/icon/voice/grid-mask.svg";
import voiceGridVertical from "@/assets/icon/voice/grid-vertical.svg";
import voiceGridHorizontal from "@/assets/icon/voice/grid-horizontal.svg";
import voiceSettingsIcon from "@/assets/icon/voice/settings.svg";
import voiceMutedIcon from "@/assets/icon/voice/microphone-off.svg";
import voiceHangUpIcon from "@/assets/icon/voice/hang-up.svg";
import { VoiceBeam } from "voice-glow";
import { useAiPlaybackLevel } from "@/hooks/use-ai-playback-level";
import { useTheme } from "@/contexts/theme";
import { EndSessionDialog } from "./end-session-dialog";

import {
  AudioLines,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  UserRound,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mutate } from "swr";
import { toast } from "sonner";
import phoneArtwork from "@/assets/image/onboarding/phon-call.png";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        showCloseButton={false}
        overlayClassName="z-[210] bg-overlay-backdrop"
        className="z-[220] min-h-[min(600px,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] max-w-md grid-rows-[1fr_auto] overflow-y-auto bg-background p-6 sm:p-8"
      >
        <DialogHeader className="items-center justify-center gap-4 text-center">
          <DialogTitle className="sr-only">Choose a voice</DialogTitle>
          <DialogDescription className="sr-only">
            Step through the available voices and select one for your conversation.
          </DialogDescription>
          <div className="flex w-full items-center justify-between gap-6">
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
            <VoiceArtwork voice={activeVoice} />
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
            <p className="font-geist text-2xl font-semibold text-text-neutral-strong">
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
                    index === activeIndex ? "bg-fill-brand-strong" : "bg-fill-neutral-weak",
                  )}
                  aria-hidden
                />
              ))}
            </div>
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
      </DialogContent>
    </Dialog>
  );
}

function VoiceSettings({
  voices,
  initialVoice,
  initialLanguage,
  sessionActive,
  isSaving,
  onDismiss,
  onSave,
}: {
  voices: VoiceModeVoice[];
  initialVoice: VoiceModeVoice | null;
  initialLanguage: VoiceLanguageCode;
  sessionActive: boolean;
  isSaving: boolean;
  onDismiss: () => void;
  onSave: (voice: VoiceModeVoice, language: VoiceLanguageCode) => Promise<void>;
}) {
  const [draftVoice, setDraftVoice] = useState<VoiceModeVoice | null>(initialVoice);
  const [draftLanguage, setDraftLanguage] = useState<VoiceLanguageCode>(initialLanguage);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-geist text-base font-semibold text-text-neutral-strong">Settings</h2>
        <p className="mt-1 font-geist text-sm font-normal text-text-neutral-weak">Customize your voice conversation.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="voice-language" className="font-geist text-sm font-medium text-text-neutral-strong">
          Language
        </label>
        <Select value={draftLanguage} onValueChange={(value) => setDraftLanguage(value as VoiceLanguageCode)}>
          <SelectTrigger id="voice-language" aria-label="Language" className="w-full rounded-xl bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="z-[230]">
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
                  "h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-1.5 text-left transition-[transform,border-color] duration-150 active:scale-[0.98]",
                  selected && "border-stroke-brand-strong",
                )}
                role="radio"
                aria-checked={selected}
                onClick={() => setDraftVoice(voice)}
              >
                <VoiceArtwork voice={voice} className="size-7 shrink-0" />
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

      <div className="grid grid-cols-1 gap-2">
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
    if (user && introOpen === null) setIntroOpen(!user.chat_voice || (persistent && user.chat_voice_provider === "elevenlabs"));
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
        <DialogContent showCloseButton={false} overlayClassName="z-[210] bg-overlay-backdrop" className="z-[220] max-h-[calc(100dvh-2rem)] max-w-md gap-5 overflow-y-auto bg-background p-0">
          <div className="flex min-h-56 items-center justify-center bg-fill-warning-weak px-6 pt-6">
            <img src={phoneArtwork} alt="A friendly phone ready for a voice conversation" className="size-40 object-contain" />
          </div>
          <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <DialogHeader className="text-center">
              <DialogTitle className="font-geist text-2xl font-semibold text-text-neutral-strong">Try Voicemode</DialogTitle>
              <DialogDescription className="text-text-neutral-weak">
                A natural way to talk with Memento using the context you have already shared.
                {persistent && user?.chat_voice_provider === "elevenlabs" && " Choose an integrated voice to talk about texts and images in the same conversation."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {[
                [MessageCircleMore, "Intelligent, natural conversations", "Senses and responds to interruptions and nuance."],
                [UserRound, "Personalized for you", "Uses memory and your existing Memento context."],
                [AudioLines, "You’re in control", "Audio is transcribed into your chat history."],
              ].map(([Icon, title, description]) => {
                const BenefitIcon = Icon as typeof MessageCircleMore;
                return (
                  <div key={String(title)} className="flex gap-3">
                    <BenefitIcon className="mt-0.5 shrink-0 text-text-brand-strong" aria-hidden />
                    <div>
                      <p className="font-geist text-sm font-semibold text-text-neutral-strong">{String(title)}</p>
                      <p className="font-geist text-sm leading-5 text-text-neutral-weak">{String(description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button type="button" size="lg" onClick={() => { setIntroOpen(false); setPickerOpen(true); }}>Continue</Button>
              <Button type="button" variant="outline" size="lg" onClick={onCancel}>Dismiss</Button>
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

  if (inline) {
    const overview = variant === "overview";
    const floating = variant === "floating";
    const callStatus = isStartingCall ? "Connecting…" : sessionActive
      ? (reconnecting ? "Reconnecting…" : audioPaused ? "Audio paused" : muted ? "You’re muted" : thinking ? "Thinking…" : "Listening") : "Ready to connect";
    const settings = (
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon-lg" aria-label="Voice settings" className={floating ? "absolute right-4 top-4 size-10 rounded-full text-icon-neutral-weaker" : overview ? "size-12 rounded-full bg-fill-neutral-weak" : undefined}>
            {overview ? <img src={voiceSettingsIcon} alt="" className="dark:brightness-0 dark:invert dark:opacity-60" /> : <Settings />}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" sideOffset={8} collisionPadding={16} aria-label="Voice settings" className="max-h-[min(35dvh,calc(100dvh-2rem))] w-[min(13rem,calc(100vw-2rem))] overflow-y-auto p-3">
          <VoiceSettings voices={voices} initialVoice={selectedVoice} initialLanguage={languageCode} sessionActive={sessionActive} isSaving={isSaving} onDismiss={() => setSettingsOpen(false)} onSave={handleSettingsSave} />
        </PopoverContent>
      </Popover>
    );
    const controls = (
      <div className={cn("flex items-center", overview || floating ? "gap-4" : "gap-2")}>
        <Button type="button" variant={overview ? "ghost" : "outline"} size="icon-lg" className={floating ? "size-16 rounded-full bg-fill-neutral-strong text-primary-foreground [&_svg]:size-6" : overview ? "size-16 rounded-full bg-fill-neutral-weak p-5 text-icon-neutral-weak" : undefined} disabled={!sessionActive || isElevenLabsProvider} onClick={toggleMute} aria-label={muted ? "Unmute microphone" : "Mute microphone"} aria-pressed={muted}>
          {overview ? <img src={voiceMutedIcon} alt="" aria-hidden className="shrink-0 dark:brightness-0 dark:invert" /> : muted ? <MicOff /> : <Mic className="text-icon-neutral-weaker" />}
        </Button>
        {!overview && !floating && settings}
        <Button type="button" variant={overview ? "ghost" : "outline"} size="icon-lg" className={overview || floating ? "size-16 rounded-full bg-fill-error-weak text-icon-error-strong hover:bg-fill-error-weak/80" : undefined} aria-label="End voice conversation" disabled={isDisconnecting} onClick={() => setEndDialogOpen(true)}>
          {overview ? <img src={voiceHangUpIcon} alt="" className="dark:brightness-150 dark:saturate-50" /> : <PhoneOff />}
        </Button>
      </div>
    );
    return (
      <>
      {onboardingModals}
      {endConfirmation}
      <VoiceBeam type="default" theme={resolvedTheme} colorVariant="sunset" level={aiLevel} idle={0} active={sessionActive && !isElevenLabsProvider} borderRadius={overview ? 24 : undefined} style={{ display: "block", width: "100%" }}>
        <section aria-label="Voice conversation" className={cn("relative isolate flex flex-col text-text-neutral-strong", overview ? "min-h-[178px] justify-between gap-[18px] overflow-hidden rounded-3xl border border-stroke-neutral-weaker bg-fill-overview-banner p-6" : floating ? "dark min-h-[378px] max-h-[calc(100dvh-100px)] items-center justify-center gap-12 overflow-y-auto rounded-[32px] bg-fill-voice-elevated px-6 py-12 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25)] ring-1 ring-white/10" : "min-h-[130px] justify-center gap-4 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak p-4")}>
          {floating ? <>
            <button type="button" data-voice-drag-handle aria-label="Move voice window" title="Drag to move. Use arrow keys when focused." className="absolute left-4 top-4 flex h-8 w-16 touch-none cursor-grab items-center justify-center rounded-full text-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white active:cursor-grabbing"><span aria-hidden className="h-1 w-8 rounded-full bg-current" /></button>
            {settings}
            <div className="flex flex-col items-center gap-4">
              <VoiceArtwork voice={selectedVoice} className="size-[92px]" />
              <div className="flex flex-col items-center gap-1">
                <span aria-label="Call duration" className="font-geist text-xl font-bold tabular-nums">{formatVoiceSessionTime(recordingTime)}</span>
                <p role="status" className="flex items-center gap-2 font-geist text-sm text-text-neutral-weak"><span aria-hidden className={cn("size-2 rounded-full", muted ? "bg-fill-error-strong" : "bg-fill-success-strong")} />{callStatus}</p>
              </div>
            </div>
            {controls}
          </> : overview ? <>
            <div aria-hidden className="pointer-events-none absolute -top-[203px] left-1/2 -z-10 h-[573.383px] w-[764.51px] -translate-x-1/2 rotate-[6.45deg] opacity-20" style={{ maskImage: `url(${voiceGridMask})`, maskRepeat: "no-repeat", maskPosition: "240px 0" }}>
              <img src={voiceGridVertical} alt="" className="absolute left-0 top-0 max-w-none" />
              <img src={voiceGridHorizontal} alt="" className="absolute left-0 top-0 max-w-none" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <span aria-label="Call duration" className="font-garamond text-[30px] leading-[34px] tabular-nums">{formatVoiceSessionTime(recordingTime)}</span>
                <p role="status" className="flex items-center gap-2 font-geist text-sm text-text-neutral-weak"><span aria-hidden className={cn("size-2 shrink-0 rounded-full", muted ? "bg-fill-error-strong" : sessionActive ? "bg-fill-success-strong" : "bg-fill-neutral-strong")} />{callStatus}</p>
              </div>
              {settings}
            </div>
            {controls}
          </> : <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <VoiceArtwork voice={selectedVoice} className="size-12" />
              <div className="flex flex-col gap-1">
                <p className="font-inter text-sm font-semibold">{isStartingCall ? "Connecting…" : sessionActive ? "Let’s talk" : "Voice conversation"}</p>
                <p role="status" className="font-inter text-xs text-text-neutral-weak">{callStatus} · {formatVoiceSessionTime(recordingTime)}</p>
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
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon-lg" aria-label="Voice settings">
                <Settings />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              className="z-[220] max-h-[min(35dvh,calc(100dvh-2rem))] w-[min(13rem,calc(100vw-2rem))] overflow-y-auto bg-background p-3 shadow-overlay-backdrop-dark"
            >
              <VoiceSettings
                voices={voices}
                initialVoice={selectedVoice}
                initialLanguage={languageCode}
                sessionActive={sessionActive}
                isSaving={isSaving}
                onDismiss={() => setSettingsOpen(false)}
                onSave={handleSettingsSave}
              />
            </PopoverContent>
          </Popover>
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
