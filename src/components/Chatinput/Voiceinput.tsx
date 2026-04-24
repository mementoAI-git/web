"use client";

import { MicIcon, MicOffIcon, GearIcon } from "@/components/icons";
import { createPortal } from "react-dom";
import { cn } from "@/utility";
import { useEffect, useRef, useState } from "react";
import { PhoneOff } from "lucide-react";
import { useLiveAPI } from "@/hooks/use-live-api";
import { Visual3D } from "./AudioVisual3D";
import ChatSettings from "../modal/chat-settings";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { useStore } from "@/hooks/use-store";

interface VoiceinputProps {
  onCancel: () => void;
  memoryId?: string | null;
  history?: { role: "user" | "ai"; text: string }[];
}

export default function Voiceinput({ onCancel, memoryId, history = [] }: VoiceinputProps) {
  const { user } = useStore();
  const {
    connected,
    connect,
    startRecording,
    stopRecording,
    disconnect,
    inputNode,
    outputNode,
    isRecording,
    error,
  } = useLiveAPI({ memoryId, turns: history, autoConnect: false });

  const [muted, setMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [elevenLabsActive, setElevenLabsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const isElevenLabsProvider = user?.chat_voice_provider === "elevenlabs";
  const elevenLabsTalkToUrl =
    import.meta.env.VITE_ELEVENLABS_TALK_TO_URL ||
    "https://elevenlabs.io/app/talk-to?agent_id=agent_1701kpzx5njhfxp991evy221ybnj&branch_id=agtbrch_0401kpzx5qmbf76rx7zbsrety678";

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartCall = async () => {
    if (isStartingCall || isRecording) return;
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsStartingCall(false);
    }
  };

  const toggleMute = () => {
    if (!isRecording) return;
    setMuted((m) => !m);
  };

  const handleEndCall = async () => {
    if (isDisconnecting) return;
    setIsDisconnecting(true);

    try {
      if (isRecording) {
        setMuted(true);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      await stopRecording();
      if (connected) {
        disconnect();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      setElevenLabsActive(false);

      onCancel();
    } catch (err) {
      console.error(err);
      onCancel();
    } finally {
      await mutate(`${endpoint.conversations}?page=1`);
      setIsDisconnecting(false);
    }
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col",
        /* Solid opaque base — no translucent gradient or tokens that show the chat page through */
        "bg-sand-1",
        "text-v3-text-strong",
      )}
      data-testid="voice-mode-layer"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <button
          type="button"
          onClick={() => void handleEndCall()}
          disabled={isDisconnecting}
          className={cn(
            "btn-outline-v3 inline-flex items-center gap-2 !rounded-2xl !py-2.5 !pl-3 !pr-4 text-sm font-medium",
            isDisconnecting && "pointer-events-none opacity-60",
          )}
          aria-label="End call and return to chat"
        >
          {isDisconnecting ? (
            <span
              className="size-4 shrink-0 animate-spin rounded-full border-2 border-v3-stroke-weak border-t-transparent"
              aria-hidden
            />
          ) : (
            <PhoneOff className="size-4 shrink-0 stroke-[1.75]" strokeWidth={1.75} aria-hidden />
          )}
          End call
        </button>

        <ChatSettings onOpenChange={setSettingsOpen}>
          {!settingsOpen ? (
            <button
              type="button"
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                "border border-v3-stroke-weak/80 bg-v3-fill-weaker text-v3-icon-neutral",
                "transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong",
              )}
              aria-label="Chat settings"
            >
              <GearIcon className="size-5 stroke-2" aria-hidden />
            </button>
          ) : (
            <span
              className="invisible flex size-11 shrink-0"
              aria-hidden
            />
          )}
        </ChatSettings>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-8">
        <div className="flex w-full max-w-3xl flex-col items-center gap-8 sm:gap-10">
          <div
            className={cn(
              "flex flex-col items-center gap-6 sm:gap-8",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500",
            )}
          >
            <div className="relative size-[min(200px,55vw)] max-h-[220px] max-w-[220px] sm:size-52">
              <div
                className="absolute inset-0 rounded-full bg-v3-fill-weak blur-xl"
                aria-hidden
              />
              {isElevenLabsProvider ? (
                <div className="relative mx-auto flex size-[120px] items-center justify-center rounded-full border border-v3-stroke-weak/60 bg-v3-fill-weaker shadow-[0_12px_40px_-12px_rgba(60,40,20,0.25)] sm:size-[132px]">
                  <span className="font-inter text-[11px] font-medium text-v3-text-weaker">ElevenLabs Agent</span>
                </div>
              ) : (
                <div className="relative mx-auto size-[120px] overflow-hidden rounded-full shadow-[0_12px_40px_-12px_rgba(60,40,20,0.25)] ring-1 ring-v3-stroke-weak/60 sm:size-[132px]">
                  <Visual3D inputNode={inputNode} outputNode={outputNode} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p
                className="font-garamond text-3xl tabular-nums tracking-tight text-v3-text-strong sm:text-4xl"
                aria-live="polite"
              >
                {formatTime(recordingTime)}
              </p>
              <p className="font-inter text-xs text-v3-text-weaker sm:text-sm">
                {isElevenLabsProvider ? (
                  elevenLabsActive ? "ElevenLabs session live" : "Ready for ElevenLabs voice agent"
                ) : isRecording ? (
                  <>
                    <span
                      className={cn(
                        "mr-1.5 inline-block size-1.5 rounded-full align-middle",
                        connected ? "bg-emerald-500" : "bg-v3-fill-neutral-weaker",
                      )}
                      aria-hidden
                    />
                    {connected ? "Live session" : "Connecting…"}
                  </>
                ) : (
                  "Ready when you are"
                )}
              </p>
            </div>
          </div>

          {isElevenLabsProvider && elevenLabsActive ? (
            <div className="w-full overflow-hidden rounded-2xl border border-v3-stroke-weak bg-white">
              <iframe
                src={elevenLabsTalkToUrl}
                title="ElevenLabs Agent"
                className="h-[480px] w-full"
                allow="microphone; autoplay"
              />
            </div>
          ) : null}

          {error ? (
            <p className="max-w-sm text-center font-inter text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex w-full flex-col items-center justify-center gap-4">
            {!isRecording && !elevenLabsActive ? (
              <button
                type="button"
                onClick={() => void handleStartCall()}
                disabled={isStartingCall}
                className={cn(
                  "btn min-h-[52px] min-w-[200px] rounded-2xl px-10 py-3.5 font-inter text-base font-semibold sm:min-w-[240px] sm:text-lg",
                  isStartingCall && "pointer-events-none opacity-80",
                )}
              >
                {isStartingCall ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-5 shrink-0 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
                      aria-hidden
                    />
                    Starting…
                  </span>
                ) : (
                  "Start call"
                )}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl border transition-colors sm:size-16",
                    "border-v3-stroke-weak bg-v3-fill-weaker text-v3-icon-neutral",
                    "hover:bg-v3-fill-weak hover:text-v3-text-strong",
                    muted &&
                      "border-stroke-error-weak bg-fill-error-weak/90 text-text-error-strong hover:bg-fill-error-weaker",
                  )}
                  aria-pressed={muted}
                  aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                >
                  {muted ? (
                    <MicOffIcon className="size-6 stroke-2 text-current sm:size-7" aria-hidden />
                  ) : (
                    <MicIcon className="size-6 text-current sm:size-7" aria-hidden />
                  )}
                </button>
                <span className="font-inter text-xs text-v3-text-weaker">
                  {muted ? "You’re muted" : "Tap to mute"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
