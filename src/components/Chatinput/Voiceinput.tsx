"use client";

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
import { mutate } from "swr";
import { toast } from "sonner";
import phoneArtwork from "@/assets/image/onboarding/phon-call.png";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import {
  formatVoiceSessionTime,
  useVoiceModeVoices,
  type VoiceModeVoice,
} from "./voice-mode-voices";

interface VoiceinputProps {
  onCancel: () => void;
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
    <img src={voice.artwork} alt="" className={cn("size-32 rounded-full object-cover", className)} />
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
        className="z-[220] min-h-[600px] max-w-md grid-rows-[1fr_auto] overflow-hidden bg-background p-6 sm:p-8"
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
    <div className="flex flex-col gap-5">
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
                  "h-auto min-h-14 w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left transition-[transform,border-color] duration-150 active:scale-[0.98]",
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

      <div className="grid grid-cols-2 gap-3">
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

export default function Voiceinput({ onCancel, memoryId, history = [] }: VoiceinputProps) {
  const { user } = useStore();
  const [languageCode, setLanguageCode] = useState<VoiceLanguageCode>("en-US");
  const {
    connected,
    connect,
    startRecording,
    stopRecording,
    disconnect,
    restartSession,
    setInputMuted,
    isRecording,
    error,
  } = useLiveAPI({ memoryId, turns: history, languageCode, autoConnect: false });
  const { voices, selectedVoice, saveVoice, isSaving } = useVoiceModeVoices();
  const [introOpen, setIntroOpen] = useState<boolean | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [elevenLabsActive, setElevenLabsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const isElevenLabsProvider = user?.chat_voice_provider === "elevenlabs";
  const sessionActive = isRecording || elevenLabsActive;
  const elevenLabsTalkToUrl =
    import.meta.env.VITE_ELEVENLABS_TALK_TO_URL ||
    "https://elevenlabs.io/app/talk-to?agent_id=agent_1701kpzx5njhfxp991evy221ybnj&branch_id=agtbrch_0401kpzx5qmbf76rx7zbsrety678";

  useEffect(() => {
    if (user && introOpen === null) setIntroOpen(!user.chat_voice);
  }, [introOpen, user]);

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
      await connect();
      await startRecording();
    } catch (startError) {
      console.error(startError);
    } finally {
      setIsStartingCall(false);
    }
  };

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
      onCancel();
    } finally {
      void mutate(`${endpoint.conversations}?page=1`);
      setIsDisconnecting(false);
    }
  };

  const handleVoiceSelection = async (voice: VoiceModeVoice, close: "picker" | "settings") => {
    const saved = await saveVoice(voice);
    if (!saved) {
      toast.error("Failed to update voice settings");
      return;
    }
    if (close === "picker") setPickerOpen(false);
    else setSettingsOpen(false);
  };

  const handleSettingsSave = async (voice: VoiceModeVoice, language: VoiceLanguageCode) => {
    const saved = await saveVoice(voice);
    if (!saved) {
      toast.error("Failed to update voice settings");
      return;
    }
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
    return connected ? "Live session" : "Connecting…";
  }, [connected, isElevenLabsProvider, sessionActive]);

  if (!user || introOpen === null) {
    return createPortal(<div className="fixed inset-0 z-[200] bg-background" />, document.body);
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-background text-text-neutral-strong" data-testid="voice-mode-layer">
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
              className="z-[220] max-h-[calc(100dvh-5rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto bg-background p-5 shadow-overlay-backdrop-dark"
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

          {error ? (
            <div className="flex max-w-sm flex-col items-center gap-3" role="alert">
              <p className="font-geist text-sm text-text-error-strong">{error}</p>
              <Button type="button" variant="outline" onClick={() => void handleStartCall()}>Try again</Button>
            </div>
          ) : null}

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

      <Dialog open={introOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent showCloseButton={false} overlayClassName="z-[210] bg-overlay-backdrop" className="z-[220] max-w-md gap-5 overflow-hidden bg-background p-0">
          <div className="flex min-h-56 items-center justify-center bg-fill-warning-weak px-6 pt-6">
            <img src={phoneArtwork} alt="A friendly phone ready for a voice conversation" className="size-40 object-contain" />
          </div>
          <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
            <DialogHeader className="text-center">
              <DialogTitle className="font-geist text-2xl font-semibold text-text-neutral-strong">Try Voicemode</DialogTitle>
              <DialogDescription className="text-text-neutral-weak">
                A natural way to talk with Memento using the context you have already shared.
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
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent showCloseButton={false} overlayClassName="z-[210] bg-overlay-backdrop" className="z-[220] min-h-96 max-w-md content-between bg-background p-6 sm:p-8">
          <DialogHeader className="items-center gap-5 pt-5 text-center">
            <PhoneOff className="text-text-warning-strong" aria-hidden />
            <div className="flex flex-col items-center gap-3">
              <DialogTitle className="max-w-xs font-geist text-xl font-semibold leading-7 text-text-neutral-strong">
                Are you sure you want to end this session?
              </DialogTitle>
              <DialogDescription className="font-geist tabular-nums text-text-neutral-weak">
                {formatVoiceSessionTime(recordingTime)}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setEndDialogOpen(false)}>Dismiss</Button>
            <Button type="button" size="lg" disabled={isDisconnecting} onClick={() => void handleEndCall()}>
              {isDisconnecting ? "Ending…" : "End Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
}
