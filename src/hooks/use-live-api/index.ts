"use client";
import { buildVoiceInputParts } from "@/features/voice/message-input";
import type { VoiceMessage, VoiceTextInput } from "@/features/voice/types";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenAI, LiveServerMessage, Session, Modality } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import {
  createPlaybackState,
  scheduleGeminiLivePcmChunk,
  stopAllGeminiLivePlayback,
  waitGeminiLivePlaybackTail,
  type GeminiLivePlaybackState,
} from "./playback";
import { mutate } from "swr";
import { get, post } from "@/api/mutations";
import { voiceToolsEnabled, voiceTokenParams } from "@/features/voice/tools/capabilities";
import {
  CALL_TIME_UP_MESSAGE,
  FREE_MINUTES_UP_MESSAGE,
  callLimitWording,
  callLimitSchedule,
  isCallTimeUp,
  isFreeVoiceMinutesUp,
  parseVoiceCallTime,
} from "@/features/voice/call-limit";
import { createCallActionHandlers, resolveWebDestination, showWebDestination, type CallControls } from "@/features/voice/tools/call-actions";
import { VoiceToolRelay } from "@/features/voice/tools/relay";
import { DomScreen } from "@/features/voice/screen/dom-screen";
import { webScreenName } from "@/features/voice/screen/screen-names";
import { createScreenControlHandlers } from "@/features/voice/screen/tools";
import {
  createServerToolHandlers,
  serverToolNames,
  type VoiceRefreshable,
  type VoiceToolEffect,
} from "@/features/voice/tools/server-tools";
import {
  nextReconnectDelay,
  resumeHandleFrom,
  VOICE_RESUME_SETUP_TIMEOUT_MS,
  VOICE_SETUP_TIMEOUT_MS,
  type ReconnectReason,
  type ReconnectResult,
} from "@/features/voice/connection";
import { withDeadline } from "@/features/voice/tools/relay";
import { frameLevel, VOICE_THINKING_SPEECH_GAP_MS, VoiceThinkingTracker } from "@/features/voice/turns/thinking";
import { parseHybridEndMs, VoiceHybridEnd } from "@/features/voice/turns/hybrid-end";
import {
  PlaybackEchoMeter,
  shouldRestore,
  VOICE_FALLBACK_RECHECK_MS,
  VoiceSelfInterruptGuard,
} from "@/features/voice/turns/self-interrupt-guard";
import { createBlob } from "./utils";
import { GEMINI_CONFIG } from "./config";
import { createSystemContext, isEmpty } from "@/utility";
import useFetcher from "../use-fetcher";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";
import { BrowserCallRecorder } from "@/features/voice/recording/browser-recorder";
import { RecordingTranscript, speechSpansFromActivity } from "@/features/voice/recording/call-recording";
import { readRecordConversations } from "@/features/voice/recording/preference";
import { drainCallRecordings, finishCallRecording } from "@/features/voice/recording/store";
import {
  captureGeminiLiveGeneration,
  createGeminiLiveSessionId,
} from "@/lib/ai-observability";

// Transcript entry type
export type TranscriptEntry = {
  role: 'user' | 'ai';
  text: string;
};

interface UseLiveAPIProps {
  connectionPersonId?: string;
  memoryId?: string | null;
  turns?: { role: "user" | "ai", text: string }[];
  languageCode?: string;
  /** When false (default), the session is not opened until `connect()` runs (e.g. user taps “Start call”). */
  autoConnect?: boolean;
  onMessages?: (messages: VoiceMessage[]) => void;
  /**
   * What voice tools may do on the screen. Without it, the session asks for
   * no tools, so Memento only talks.
   */
  toolControls?: VoiceToolControls;
}

/** The voice screen's side of the call actions. */
export type VoiceToolControls = {
  navigate: (href: string) => void;
  /** Open one of the app's modals by its useModal name. */
  openModal?: (name: string) => void;
  /** Reflect a mute Memento made (the hook already muted the microphone). */
  setMuted: (muted: boolean) => void;
  /** Hang up, as the End call button does. */
  endCall: () => void;
  /** Back to the previous page, for "go back". */
  goBack?: () => void;
  canGoBack?: () => boolean;
};

/** Longest Memento's goodbye may take before the call ends anyway. */
const GOODBYE_LIMIT_MS = 10_000;

/** SWR cache keys each refresh effect revalidates. */
const REFRESH_PREFIXES: Record<VoiceRefreshable, string[]> = {
  profile: [endpoint.profile, endpoint.userStats],
  memories: [endpoint.memories],
  capsules: [endpoint.capsule],
  beneficiaries: [endpoint.beneficiaries],
  observations: [endpoint.personaObservations],
};

export type LiveSessionOverrides = {
  languageCode?: string;
  voiceName?: string;
};

type LiveToken = { token?: string; connectionSessionId?: string; live?: { model?: string }; tools?: unknown };

const VOICE_CONNECTION_LOST = "The voice connection was lost. Please start the call again.";

/** Off unless set, as on mobile; see features/voice/turns/hybrid-end. */
const HYBRID_END_MS = parseHybridEndMs(import.meta.env.VITE_VOICE_HYBRID_END_MS);
/** On unless VITE_VOICE_SELF_INTERRUPT_GUARD=false. */
const SELF_INTERRUPT_GUARD = import.meta.env.VITE_VOICE_SELF_INTERRUPT_GUARD !== "false";
const THINKING_CHECK_MS = 150;

/**
 * The API rejects a missing or malformed memory_id, which would fail every save
 * in the call. Without one, the session id keeps the call in its own conversation.
 */
function savedConversationId(memoryId: string | null | undefined) {
  return memoryId && /^[a-f\d]{24}$/i.test(memoryId) ? { memory_id: memoryId } : {};
}

export function useLiveAPI({
  connectionPersonId,
  memoryId,
  turns = [],
  languageCode = "en-US",
  autoConnect = false,
  onMessages,
  toolControls,
}: UseLiveAPIProps) {
  const toolControlsRef = useRef(toolControls);
  toolControlsRef.current = toolControls;
  const relayRef = useRef<VoiceToolRelay | null>(null);
  const pendingEndRef = useRef<{ then?: () => void; heardGoodbye: boolean; timer: ReturnType<typeof setTimeout> } | null>(null);
  const { user } = useStore();
  const messageObserver = useRef(onMessages);
  messageObserver.current = onMessages;
  const connectionSession = useRef<string | null>(null);
  const memoryIdRef = useRef(memoryId);
  if (memoryId) memoryIdRef.current = memoryId;
  const [isRecording, setIsRecording] = useState(false);
  const [, setStatus] = useState('');
  const [inputNode, setInputNode] = useState<GainNode | null>(null);
  const [outputNode, setOutputNode] = useState<GainNode | null>(null);
  const [audioPaused, setAudioPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionAttempt = useRef(0);
  const cancelSetup = useRef<(() => void) | null>(null);
  const clientRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const isRecordingRef = useRef(false);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const playbackStateRef = useRef<GeminiLivePlaybackState | null>(null);
  const isConnectingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const aiSessionIdRef = useRef<string | null>(null);
  const turnStartedAtRef = useRef<number | null>(null);
  const firstResponseAtRef = useRef<number | null>(null);
  const ephemeralTokenRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);
  // One call can span several Gemini connections (features/voice/connection):
  // only the active one plays and hears; a replacement just completes setup.
  const activeSocketRef = useRef(0);
  const socketSeqRef = useRef(0);
  const socketOpenRef = useRef(false);
  const resumeHandleRef = useRef<string | null>(null);
  /** The call's time-limit ticket, sent back on reconnect; null when calls are not limited. */
  const callTicketRef = useRef<string | null>(null);
  const callLimitTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Set when the server refused to reconnect because the call's time was up. */
  /** Set when a reconnect is refused because time is up: what to tell them as the call ends. */
  const callTimeUpRef = useRef<string | null>(null);
  const reconnectingRef = useRef(false);
  const [reconnecting, setReconnecting] = useState(false);
  const callSetupRef = useRef<{ overrides: LiveSessionOverrides; wantsTools: boolean }>({ overrides: {}, wantsTools: false });
  const reconnectRef = useRef<(reason: ReconnectReason) => Promise<ReconnectResult>>(async () => "unavailable");
  const connectionLostRef = useRef<(socketId: number, message: string | null) => Promise<void>>(async () => {});
  const endLostCallRef = useRef<(message: string | null) => void>(() => {});
  // A go-away or network change whose reconnect ran out of time leaves a call
  // that looks connected but can't talk. End it and say so.
  const endIfReconnectFailedRef = useRef((result: ReconnectResult) => {
    if (result === "failed" && hasConnectedRef.current) endLostCallRef.current(VOICE_CONNECTION_LOST);
  });
  // Turn-taking (features/voice/turns): Thinking, hybrid end of turn, and
  // not listening while Memento talks when it keeps hearing itself.
  const thinkingRef = useRef(new VoiceThinkingTracker());
  const [thinking, setThinking] = useState(false);
  const hybridEndRef = useRef(new VoiceHybridEnd(HYBRID_END_MS));
  const selfInterruptRef = useRef<VoiceSelfInterruptGuard | null>(null);
  const echoMeterRef = useRef(new PlaybackEchoMeter());
  const notListeningWhileTalkingRef = useRef(false);
  const selfInterruptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When Memento's current reply became audible. */
  const replyAudibleAtRef = useRef<number | null>(null);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  // The conversation being recorded to Stories ("Record conversations"), and its transcript timing.
  const callRecordingRef = useRef<{ recorder: BrowserCallRecorder; transcript: RecordingTranscript; sessionId: string } | null>(null);
  const [isRecordingCall, setIsRecordingCall] = useState(false);
  const userIdRef = useRef<string | undefined>(undefined);
  const transcriptText = useRef({ user: "", ai: "" })

  const turnTimerRef = useRef({
    duration: 0,
    startTime: null,
    interval: null
  });

  const context = useMemo(() => createSystemContext(user), [user]);
  userIdRef.current = user?._id;

  const { trigger: fetchEphemeralToken } = useFetcher(endpoint.ephemeralToken, "get")
  const { trigger: addMessageToMemory } = useFetcher(endpoint.addMessageToMemory, "post")

  /** Memento's audio is playing (queued chunks have not all ended). */
  const isAiSpeaking = useCallback(() => (playbackStateRef.current?.sources.size ?? 0) > 0, []);

  /** The call ended: no pending check may restore listening into the next one. */
  const stopTurnTaking = useCallback(() => {
    if (selfInterruptTimerRef.current) clearTimeout(selfInterruptTimerRef.current);
    selfInterruptTimerRef.current = null;
    selfInterruptRef.current = null;
    notListeningWhileTalkingRef.current = false;
  }, []);

  /** Fresh turn-taking state for a new call. */
  const resetTurnTaking = useCallback(() => {
    thinkingRef.current.reset();
    hybridEndRef.current = new VoiceHybridEnd(HYBRID_END_MS);
    echoMeterRef.current = new PlaybackEchoMeter();
    notListeningWhileTalkingRef.current = false;
    replyAudibleAtRef.current = null;
    if (selfInterruptTimerRef.current) clearTimeout(selfInterruptTimerRef.current);
    selfInterruptTimerRef.current = null;
    if (!SELF_INTERRUPT_GUARD) {
      selfInterruptRef.current = null;
      return;
    }
    // Loud speakers can beat the browser's echo cancellation, and Memento
    // keeps interrupting itself. When it does, stop listening while Memento
    // talks for a while, then try again once the echo has dropped.
    const guard = new VoiceSelfInterruptGuard({
      now: Date.now,
      onFallback: durationMs => {
        const meter = echoMeterRef.current;
        const echoAtFallback = meter.level;
        meter.startMeasuring();
        notListeningWhileTalkingRef.current = true;
        console.info("[voice] Memento is hearing itself; not listening while it talks", { durationMs, echo: echoAtFallback });
        const check = (afterMs: number) => {
          if (selfInterruptTimerRef.current) clearTimeout(selfInterruptTimerRef.current);
          selfInterruptTimerRef.current = setTimeout(() => {
            selfInterruptTimerRef.current = null;
            if (selfInterruptRef.current !== guard) return;
            const current = echoMeterRef.current;
            if (!shouldRestore(echoAtFallback, current.level, current.measuredSeconds)) {
              check(VOICE_FALLBACK_RECHECK_MS);
              return;
            }
            guard.restore();
            notListeningWhileTalkingRef.current = false;
            console.info("[voice] the echo dropped; listening while Memento talks again", { echo: current.level });
          }, afterMs);
        };
        check(durationMs);
      },
    });
    selfInterruptRef.current = guard;
  }, []);

  /** The call is over: late tool results are dropped and no hang-up is pending. */
  const stopVoiceTools = useCallback(() => {
    relayRef.current?.dispose();
    relayRef.current = null;
    if (pendingEndRef.current) clearTimeout(pendingEndRef.current.timer);
    pendingEndRef.current = null;
  }, []);

  /** Hangs up after Memento's goodbye has played. */
  const finishPendingEnd = useCallback(async () => {
    const pending = pendingEndRef.current;
    if (!pending) return;
    pendingEndRef.current = null;
    clearTimeout(pending.timer);
    const output = outputAudioContextRef.current;
    if (output && playbackStateRef.current) await waitGeminiLivePlaybackTail(output, playbackStateRef.current);
    toolControlsRef.current?.endCall();
    pending.then?.();
  }, []);

  const clearCallLimit = useCallback(() => {
    callLimitTimersRef.current.forEach(clearTimeout);
    callLimitTimersRef.current = [];
  }, []);

  /**
   * Arms the call's time limit, when the server sets one: a spoken heads-up
   * near the end, then a goodbye after which the call ends. Called again on
   * each reconnect with the server's fresh count.
   */
  const scheduleCallLimit = useCallback((token: unknown) => {
    clearCallLimit();
    const callTime = parseVoiceCallTime(token);
    if (!callTime) return;
    callTicketRef.current = callTime.ticket;
    const ask = (text: string) => {
      void sessionPromiseRef.current
        ?.then(session => session.sendClientContent({ turns: [{ role: "user", parts: [{ text }] }], turnComplete: true }))
        .catch(error => console.warn("[voice] call time notice failed", error));
    };
    const wording = callLimitWording(callTime.reason);
    const { warnInMs, endInMs } = callLimitSchedule(callTime.secondsLeft);
    if (warnInMs !== null) callLimitTimersRef.current.push(setTimeout(() => ask(wording.endingSoon), warnInMs));
    callLimitTimersRef.current.push(setTimeout(() => {
      if (!hasConnectedRef.current) return;
      ask(wording.timeUp);
      if (!toolControlsRef.current) {
        endLostCallRef.current?.(wording.message);
        return;
      }
      // Ends after the goodbye plays, as for end_call.
      if (pendingEndRef.current) clearTimeout(pendingEndRef.current.timer);
      pendingEndRef.current = { heardGoodbye: false, timer: setTimeout(() => void finishPendingEnd(), GOODBYE_LIMIT_MS) };
    }, endInMs));
  }, [clearCallLimit, finishPendingEnd]);

  const validateConnectionVoice = useCallback(async () => {
    if (!connectionPersonId) return;
    if (!connectionSession.current) throw new Error("Connection voice is not ready.");
    await get(`/people/${encodeURIComponent(connectionPersonId)}/voice/${encodeURIComponent(connectionSession.current)}`, {skipErrorHandling:true});
  }, [connectionPersonId]);

  useEffect(() => {
    if (!connectionPersonId || !connected) return;
    let checking = false;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (checking || cancelled) return;
      checking = true;
      try { await validateConnectionVoice(); }
      catch {
        if (cancelled) return;
        ++connectionAttempt.current;
        void sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
        endLostCallRef.current("This Memento’s shared context changed. End this call and start again.");
      } finally { checking = false; }
    }, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [connectionPersonId, connected, validateConnectionVoice]);

  /**
   * Records the host's own calls (not a connection's) when "Record conversations"
   * is on, as on mobile. Muting sends silence, so it is recorded as silence.
   */
  const startCallRecording = useCallback((stream: MediaStream) => {
    if (connectionPersonId || callRecordingRef.current) return;
    const userId = userIdRef.current;
    const output = outputAudioContextRef.current;
    if (!userId || !output || !outputNode || !readRecordConversations(userId) || !BrowserCallRecorder.isSupported()) return;
    const recorder = new BrowserCallRecorder(output, outputNode);
    if (!recorder.start(stream)) return;
    callRecordingRef.current = { recorder, transcript: new RecordingTranscript(() => recorder.elapsedMs), sessionId: uuidv4() };
    setIsRecordingCall(true);
  }, [connectionPersonId, outputNode]);

  /** Ends the recording and saves it as a story; a call where nothing was said is dropped. */
  const finishCallRecordingNow = useCallback(() => {
    const current = callRecordingRef.current;
    callRecordingRef.current = null;
    setIsRecordingCall(false);
    if (!current) return;
    const userId = userIdRef.current;
    void current.recorder.stop().then(recording => {
      if (!recording || !userId) return;
      const segments = current.transcript.segments(recording.durationMs);
      if (!segments.length) return;
      return finishCallRecording({
        userId,
        sessionId: current.sessionId,
        recording: { ...recording, segments, speech: speechSpansFromActivity(recording.activity) },
      }).then(result => {
        // As on mobile: reassure the person their conversation is kept once it is safe.
        toast.success(result === "sent"
          ? "Your conversation recording is saved to Stories"
          : "Your conversation recording is saved and will appear in Stories shortly");
      });
    }).catch(error => {
      console.error("[voice] the conversation recording could not be saved", error);
      toast.error("We couldn’t save this conversation’s recording");
    });
  }, []);
  const finishCallRecordingRef = useRef(finishCallRecordingNow);
  finishCallRecordingRef.current = finishCallRecordingNow;

  // Recordings an earlier call left in this browser (offline, or the tab closed while sending).
  useEffect(() => {
    const userId = user?._id;
    if (!userId) return;
    const drain = () => {
      if (callRecordingRef.current) return;
      void drainCallRecordings(userId).catch(error => console.warn("[voice] saved recordings could not be sent yet", error));
    };
    drain();
    window.addEventListener("online", drain);
    return () => window.removeEventListener("online", drain);
  }, [user?._id]);

  // Start audio recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return true;
    isRecordingRef.current = true;

    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4();
    }

    const inputAudioContext = inputAudioContextRef.current;
    if (!inputAudioContext) {
      isRecordingRef.current = false;
      setIsRecording(false);
      return false;
    }

    setStatus('Requesting microphone access...');

    try {
      await inputAudioContext.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      if (inputAudioContextRef.current !== inputAudioContext || !hasConnectedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return false;
      }
      mediaStreamRef.current = stream;

      setStatus('Microphone access granted. Starting capture...');

      const source = inputAudioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      source.connect(inputNode!);

      const bufferSize = 4096;
      const scriptProcessor = inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );
      scriptProcessorNodeRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecordingRef.current) return;
        // Nowhere to send while the connection is down or the browser is
        // offline; the browser would queue it all. The reconnect resumes the call.
        if (!socketOpenRef.current || navigator.onLine === false) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        const level = frameLevel(pcmData);
        const frameMs = (inputBuffer.duration ?? pcmData.length / 16_000) * 1_000;
        const aiSpeaking = isAiSpeaking();
        echoMeterRef.current.observe(level, frameMs, aiSpeaking);
        // Memento kept hearing itself: don't listen while it talks, for a while.
        if (notListeningWhileTalkingRef.current && aiSpeaking) return;
        thinkingRef.current.observeMic(level, frameMs);
        const endTurn = hybridEndRef.current.check(thinkingRef.current.quietForMs(), aiSpeaking);

        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({
            audio: createBlob(pcmData)
          });
          if (endTurn) session.sendRealtimeInput({ audioStreamEnd: true });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);
      startCallRecording(stream);
      setIsRecording(true);
      setStatus('🔴 Recording... Capturing PCM chunks.');
      return true;
    } catch (err) {
      setError(`Microphone access failed: ${err instanceof Error ? err.message : String(err)}`);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      isRecordingRef.current = false;
      setIsRecording(false);
      return false;
    }
  }, [inputNode, isAiSpeaking, startCallRecording]);

  // Start turn duration tracking
  const startTurnTimer = useCallback(() => {
    if (turnTimerRef.current.interval) return; // Already running

    turnTimerRef.current.startTime = Date.now();
    turnTimerRef.current.interval = setInterval(() => {
      if (turnTimerRef.current.startTime) {
        turnTimerRef.current.duration = Math.floor((Date.now() - turnTimerRef.current.startTime) / 1000);
      }
    }, 1000);
  }, []);

  // Stop turn duration tracking
  const stopTurnTimer = useCallback(() => {
    if (turnTimerRef.current.interval) {
      clearInterval(turnTimerRef.current.interval);
      turnTimerRef.current.interval = null;
    }
    turnTimerRef.current.startTime = null;
  }, []);

  const persistMessages = useCallback(async (messages: Record<string, unknown>[]) => {
    const job = saveQueue.current.catch(() => {}).then(async () => {
      const response = connectionPersonId
        ? await post<VoiceMessage[]>(`/people/${encodeURIComponent(connectionPersonId)}/voice`, {session_id: connectionSession.current, request_id: uuidv4(), messages})
        : await addMessageToMemory({ ...savedConversationId(memoryIdRef.current), session_id: sessionIdRef.current, messages });
      const saved = response?.data;
      if (!Array.isArray(saved)) throw new Error("Could not save the voice conversation.");
      if (saved[0]?.memory) memoryIdRef.current = String(saved[0].memory);
      return saved;
    });
    saveQueue.current = job;
    return job;
  }, [addMessageToMemory, connectionPersonId]);

  const recordMessages = useCallback((messages: Record<string, unknown>[], attachments: VoiceTextInput["attachments"] = []) => {
    const observer = messageObserver.current;
    const local = messages.map(message => ({ ...message, _id: `voice-local-${uuidv4()}`, created_at: new Date().toISOString(), attatchments: attachments } as VoiceMessage));
    observer?.(local);
    void persistMessages(messages).then(saved => {
      observer?.(saved.map((message, index) => ({ ...message, clientId: local[index]._id, attatchments: attachments })));
    }).catch(() => {
      setError("Voice is connected, but the latest messages could not be saved. Keep this conversation open.");
    });
  }, [persistMessages]);

  const startAiTurn = useCallback(() => {
    if (turnStartedAtRef.current !== null) return;
    turnStartedAtRef.current = Date.now();
    firstResponseAtRef.current = null;
  }, []);

  const updateTranscriptText = useCallback((role: "user" | "ai", text?: string) => {
    if (!text) return;
    startAiTurn();
    if (role === "ai" && firstResponseAtRef.current === null) {
      firstResponseAtRef.current = Date.now();
    }
    transcriptText.current[role] += text;
    callRecordingRef.current?.transcript.heard(role, text);
    startTurnTimer();
  }, [startAiTurn, startTurnTimer]);

  const flushTranscript = useCallback((stopReason: "end_turn" | "interrupted" = "end_turn") => {
    const messages = Object.entries(transcriptText.current)
      .filter(([, text]) => text.trim() && !text.match(/<noise>/))
      .map(([role, text]) => ({ role, text, is_voice: true, duration: turnTimerRef.current.duration }));
    const turnStartedAt = turnStartedAtRef.current;
    const firstResponseAt = firstResponseAtRef.current;
    transcriptText.current = { user: "", ai: "" };
    callRecordingRef.current?.transcript.endTurn();
    turnStartedAtRef.current = null;
    firstResponseAtRef.current = null;
    stopTurnTimer();
    turnTimerRef.current.duration = 0;
    if (!messages.length) return;

    if (aiSessionIdRef.current) {
      const completedAt = Date.now();
      captureGeminiLiveGeneration({
        sessionId: aiSessionIdRef.current,
        traceId: crypto.randomUUID(),
        model: GEMINI_CONFIG.MODEL,
        latencyMs: completedAt - (turnStartedAt ?? completedAt),
        timeToFirstTokenMs: firstResponseAt === null || turnStartedAt === null
          ? null
          : firstResponseAt - turnStartedAt,
        stopReason,
      });
    }

    recordMessages(messages);
  }, [recordMessages, stopTurnTimer]);

  const sendChatInput = useCallback(async (input: VoiceTextInput) => {
    if (!hasConnectedRef.current || !isRecordingRef.current) throw new Error("Voice is not connected yet.");
    const attempt = connectionAttempt.current;
    const parts = await buildVoiceInputParts(input);
    await validateConnectionVoice();
    const session = await sessionPromiseRef.current;
    if (!session || !hasConnectedRef.current || attempt !== connectionAttempt.current) throw new Error("The voice connection ended. Please retry your message.");
    // The audio connection stays open; this turn becomes part of the same context.
    const images = parts.filter(part => part.inlineData);
    for (let index = 0; index < images.length; index++) {
      if (!hasConnectedRef.current || attempt !== connectionAttempt.current) throw new Error("Voice disconnected while sharing the image.");
      session.sendRealtimeInput({ video: images[index].inlineData! });
      // Live image input is a video stream, with a maximum rate of one frame/second.
      if (index < images.length - 1) await new Promise(resolve => setTimeout(resolve, 1000));
    }
    startAiTurn();
    session.sendRealtimeInput({ text: parts.find(part => part.text)?.text ?? input.text });
    // Persistence must never gate delivery to the live model.
    recordMessages([{
      role: "user", text: input.text.trim() || "Shared an image", is_voice: true,
      ...(input.attachments?.length ? { attachments: input.attachments.map(file => file._id) } : {}),
    }], input.attachments);
  }, [recordMessages, startAiTurn, validateConnectionVoice]);

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    setStatus('Stopping recording...');
    isRecordingRef.current = false;
    setIsRecording(false);

    scriptProcessorNodeRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();
    scriptProcessorNodeRef.current = undefined;
    sourceNodeRef.current = undefined;
    // Before the mic track stops, so the recording ends where the call did.
    finishCallRecordingNow();

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = undefined;

    stopTurnTimer(); // Stop timer on disconnect
    turnStartedAtRef.current = null;
    firstResponseAtRef.current = null;
    setConnected(false);
    isConnectingRef.current = false;

    setStatus('Recording stopped. Click Start to begin again.');
  }, [finishCallRecordingNow, stopTurnTimer]);

  const setInputMuted = useCallback((muted: boolean) => {
    mediaStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }, []);

  /**
   * Opens one Gemini connection for call `attempt`. `activate` makes it the
   * call's connection now (the first one); a replacement only completes its
   * setup until the reconnect swaps it in.
   */
  const openSocket = useCallback((liveToken: LiveToken, overrides: LiveSessionOverrides, attempt: number, activate: boolean) => {
    const socketId = ++socketSeqRef.current;
    if (activate) {
      activeSocketRef.current = socketId;
      socketOpenRef.current = false;
    }
    const outputAudioContext = outputAudioContextRef.current!;
    let acceptSetup!: () => void;
    let rejectSetup!: (error: Error) => void;
    const setupReady = new Promise<void>((resolve, reject) => {
      acceptSetup = resolve;
      rejectSetup = reject;
    });
    const isCurrent = () => connectionAttempt.current === attempt;
    const isActive = () => isCurrent() && activeSocketRef.current === socketId;
    clientRef.current = new GoogleGenAI({
      apiKey: liveToken.token,
      httpOptions: { apiVersion: 'v1alpha' }
    });
    const sessionPromise = clientRef.current.live.connect({
      // The token is constrained to the server's model; any other model is rejected.
      model: liveToken.live?.model || GEMINI_CONFIG.MODEL,
      callbacks: {
        onmessage: async (message: LiveServerMessage) => {
          if (!isCurrent()) return;
          if (!isActive()) {
            if (message.setupComplete) acceptSetup();
            return;
          }
          if (message.setupComplete) {
            socketOpenRef.current = true;
            setConnected(true);
            isConnectingRef.current = false;
            hasConnectedRef.current = true;
            if (!sessionIdRef.current) sessionIdRef.current = uuidv4();
            const aiSessionScope = memoryIdRef.current ?? sessionIdRef.current;
            if (!aiSessionIdRef.current && aiSessionScope) {
              aiSessionIdRef.current = createGeminiLiveSessionId(aiSessionScope);
            }
            turnTimerRef.current.duration = 0;
            acceptSetup();
          }
          const handle = resumeHandleFrom(message.sessionResumptionUpdate);
          // The API starts connection calls from approved context only and ignores
          // handles, so a lost connection call ends instead of restarting blank.
          if (handle && !connectionPersonId) resumeHandleRef.current = handle;
          // Gemini is about to close this connection; carry the call over first.
          if (message.goAway) void reconnectRef.current("go-away").then(endIfReconnectFailedRef.current);

          const parts = message.serverContent?.modelTurn?.parts;
          const playback = playbackStateRef.current;

          if (pendingEndRef.current && parts?.some(part => part.inlineData?.data)) {
            pendingEndRef.current.heardGoodbye = true;
          }
          if (message.toolCall?.functionCalls?.length) {
            thinkingRef.current.observeToolCall();
            void relayRef.current?.handle(message.toolCall.functionCalls);
          }
          if (message.toolCallCancellation?.ids?.length) {
            relayRef.current?.cancel(message.toolCallCancellation.ids);
          }
          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            const audibleAt = replyAudibleAtRef.current;
            // The host was already talking as this reply started: an early
            // interruption is them, so judge it by its words, not its timing.
            const continued = audibleAt !== null && audibleAt - thinkingRef.current.lastSpokeAt() < VOICE_THINKING_SPEECH_GAP_MS;
            selfInterruptRef.current?.observeInterrupted(
              !notListeningWhileTalkingRef.current,
              audibleAt === null || continued ? undefined : Date.now() - audibleAt,
            );
            thinkingRef.current.reset();
            replyAudibleAtRef.current = null;
          }
          if (parts?.some(part => part.inlineData?.data)) {
            if (!isAiSpeaking()) replyAudibleAtRef.current = Date.now();
            thinkingRef.current.reset();
            selfInterruptRef.current?.observeModelAudio();
          }
          const heard = message.serverContent?.inputTranscription?.text;
          if (heard) {
            thinkingRef.current.observeUserTranscript();
            selfInterruptRef.current?.observeInputText(heard);
          }
          const said = message.serverContent?.outputTranscription?.text;
          if (said) selfInterruptRef.current?.observeOutputText(said);
          // A turn with no reply audio (tool only) still ends the wait.
          if (message.serverContent?.turnComplete && !isAiSpeaking()) thinkingRef.current.reset();

          if (parts && playback) {
            for (const part of parts) {
              const data = part.inlineData?.data;
              if (data) {
                try {
                  await scheduleGeminiLivePcmChunk(
                    data,
                    outputAudioContext,
                    outputNode!,
                    playback,
                  );
                } catch (error) {
                  setError(`Voice audio could not play: ${error instanceof Error ? error.message : String(error)}`);
                }
              }
            }
          }

          updateTranscriptText("user", message.serverContent?.inputTranscription?.text);
          updateTranscriptText("ai", message.serverContent?.outputTranscription?.text);
          if (message.serverContent?.turnComplete || message.serverContent?.interrupted) {
            flushTranscript(message.serverContent.interrupted ? "interrupted" : "end_turn");
          }
          if (message.serverContent?.turnComplete && pendingEndRef.current?.heardGoodbye) {
            void finishPendingEnd();
          }

          // Handle interruption
          if (interrupted && playbackStateRef.current) {
            stopAllGeminiLivePlayback(playbackStateRef.current);
          }
        },
        onerror: () => {
          if (!isCurrent()) return;
          const failure = new Error("Voice connection failed. Please try again.");
          rejectSetup(failure);
          if (!isActive()) return;
          socketOpenRef.current = false;
          void connectionLostRef.current(socketId, failure.message);
        },
        onclose: (event: CloseEvent) => {
          if (!isCurrent()) return;
          const detail = event.reason || "The voice connection closed. Please try again.";
          const failure = new Error(`Voice connection closed (${event.code}): ${detail}`);
          rejectSetup(failure);
          if (!isActive()) return;
          socketOpenRef.current = false;
          void connectionLostRef.current(socketId, event.code !== 1000 || !hasConnectedRef.current ? failure.message : null);
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: connectionPersonId ? "Use only the server-approved connection context." : context,
        speechConfig: {
          languageCode: overrides.languageCode || languageCode,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: overrides.voiceName || (
                user?.chat_voice_provider === "gemini"
                  ? (user?.chat_voice || GEMINI_CONFIG.VOICE_CONFIG.voiceName)
                  : GEMINI_CONFIG.VOICE_CONFIG.voiceName
              )
            }
          }
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      }
    });
    return { socketId, sessionPromise, setupReady, rejectSetup };
  }, [
    finishPendingEnd,
    isAiSpeaking,
    updateTranscriptText,
    flushTranscript,
    user?.chat_voice,
    user?.chat_voice_provider,
    context,
    outputNode,
    languageCode,
    connectionPersonId,
  ]);

  // Connect to Live API
  const connect = useCallback(async (overrides: LiveSessionOverrides = {}) => {
    if (!outputAudioContextRef.current) return false;

    // Prevent multiple simultaneous connection attempts
    if (hasConnectedRef.current) return true;
    if (isConnectingRef.current) return false;

    isConnectingRef.current = true;
    const outputAudioContext = outputAudioContextRef.current;
    const attempt = ++connectionAttempt.current;
    let setupTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      setError(null);
      await outputAudioContext.resume();
      const wantsTools = !connectionPersonId && Boolean(toolControlsRef.current) && voiceToolsEnabled();
      const result = await fetchEphemeralToken(
        connectionPersonId
          ? {person_id: connectionPersonId, shared_space: "true", share_inputs: "true"}
          : voiceTokenParams({ memoryId: memoryIdRef.current, tools: wantsTools }),
      );
      if (outputAudioContextRef.current !== outputAudioContext || connectionAttempt.current !== attempt) return false;
      const liveToken = result?.data as LiveToken | undefined;
      if (!liveToken?.token) {
        throw new Error("Failed to get a fresh Live API token");
      }
      connectionSession.current = liveToken.connectionSessionId || null;
      ephemeralTokenRef.current = liveToken.token;

      stopVoiceTools();
      if (wantsTools) {
        const navigate = (href: string) => toolControlsRef.current?.navigate(href);
        const openModal = (name: string) => toolControlsRef.current?.openModal?.(name);
        const applyEffects = (effects: VoiceToolEffect[]) => {
          for (const effect of effects) {
            if (effect.type === "refresh") {
              const prefixes = REFRESH_PREFIXES[effect.what];
              void mutate(key => typeof key === "string" && prefixes.some(prefix => key.startsWith(prefix)));
            } else if (effect.type === "open") {
              const target = resolveWebDestination(effect.destination);
              if (target) showWebDestination(target, { navigate, openModal });
            } else if (effect.type === "open_insight") {
              navigate(`/insights?observation=${effect.id}`);
            } else {
              navigate(`/stories/${effect.id}`);
            }
          }
        };
        const callControls: CallControls = {
          navigate,
          openModal,
          setMuted: muted => {
            mediaStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = !muted; });
            toolControlsRef.current?.setMuted(muted);
          },
          endAfterGoodbye: then => {
            if (pendingEndRef.current) clearTimeout(pendingEndRef.current.timer);
            pendingEndRef.current = { then, heardGoodbye: false, timer: setTimeout(() => void finishPendingEnd(), GOODBYE_LIMIT_MS) };
          },
        };
        relayRef.current = new VoiceToolRelay(
          async (query, also) => {
            const response = await post<{ result?: string }>(endpoint.voiceMemorySearch, { query, ...(also.length ? { also } : {}) });
            return response?.data?.result ?? "";
          },
          responses => {
            void sessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: responses }));
          },
          {
            ...createCallActionHandlers(callControls),
            ...createScreenControlHandlers({
              screen: new DomScreen({
                document,
                screenName: () => webScreenName(window.location.pathname, window.location.search),
              }),
              canGoBack: () => toolControlsRef.current?.canGoBack?.() ?? false,
              goBack: () => toolControlsRef.current?.goBack?.(),
            }),
            ...createServerToolHandlers(serverToolNames(liveToken.tools), {
              run: (name, args, invocation) => post(`${endpoint.voiceTools}/${encodeURIComponent(name)}`, {
                args,
                call_id: invocation.callId,
                session_id: sessionIdRef.current ?? undefined,
              }),
              applyEffects,
            }),
          },
        );
      }

      // Close existing session if any before creating a new one
      if (sessionPromiseRef.current) {
        try {
          const existingSession = await sessionPromiseRef.current;
          existingSession.close();
        } catch {
          // Ignore errors from closing existing session
        }
        sessionPromiseRef.current = null;
      }

      callSetupRef.current = { overrides, wantsTools };
      resumeHandleRef.current = null;
      resetTurnTaking();
      const isCurrent = () => connectionAttempt.current === attempt;
      const socket = openSocket(liveToken, overrides, attempt, true);
      cancelSetup.current = () => socket.rejectSetup(new Error("Voice connection cancelled"));
      setupTimer = setTimeout(() => socket.rejectSetup(new Error("Voice connection timed out. Please try again.")), VOICE_SETUP_TIMEOUT_MS);
      sessionPromiseRef.current = socket.sessionPromise;
      const pendingSession = socket.sessionPromise;
      // The SDK resolves on socket open, before Gemini accepts the setup.
      void pendingSession.then(session => {
        if (!isCurrent()) session.close();
      }).catch(() => {});
      const [session] = await Promise.all([pendingSession, socket.setupReady]);
      if (!isCurrent() || !hasConnectedRef.current) return false;
      // The call is up: arm its time limit, if the server set one.
      callTimeUpRef.current = null;
      scheduleCallLimit(liveToken);
      if (!connectionPersonId && !isEmpty(turns)) {
        session.sendClientContent({
          turns: turns.map(({ role, text }) => ({
            role: role === "ai" ? "model" : "user",
            parts: [{ text }],
          })),
          turnComplete: false,
        });
      }
      return true;
    } catch (error) {
      if (connectionAttempt.current !== attempt) return false;
      ++connectionAttempt.current;
      cancelSetup.current = null;
      void sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
      sessionPromiseRef.current = null;
      setError(`Connection failed: ${error instanceof Error ? error.message : error}`);
      setConnected(false);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;

      // Clear token on error to force refresh on next attempt
      ephemeralTokenRef.current = null;
      return false;
    } finally {
      clearTimeout(setupTimer);
      if (connectionAttempt.current === attempt) cancelSetup.current = null;
    }
  }, [
    stopVoiceTools,
    finishPendingEnd,
    openSocket,
    resetTurnTaking,
    fetchEphemeralToken,
    turns,
    connectionPersonId,
  ]);

  // "Thinking…": checked a few times a second, since it turns on when the host goes quiet.
  useEffect(() => {
    if (!connected) return;
    const tracker = thinkingRef.current;
    const timer = setInterval(() => setThinking(tracker.isThinking(isAiSpeaking())), THINKING_CHECK_MS);
    return () => {
      clearInterval(timer);
      tracker.reset();
      setThinking(false);
    };
  }, [connected, isAiSpeaking]);

  /** The call is over because its connection is gone for good. */
  const endLostCall = useCallback((message: string | null) => {
    if (message) setError(message);
    stopVoiceTools();
    stopTurnTaking();
    stopRecording();
    if (playbackStateRef.current) stopAllGeminiLivePlayback(playbackStateRef.current);
    setConnected(false);
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    socketOpenRef.current = false;
    resumeHandleRef.current = null;
    // Free plans: the call used some of the month's voice minutes.
    void mutate(endpoint.billingSubscription).catch(() => undefined);
  }, [stopRecording, stopTurnTaking, stopVoiceTools]);
  endLostCallRef.current = endLostCall;

  /** Carries the call over to a new connection with Gemini's resume handle; the host keeps talking. */
  const reconnect = useCallback(async (reason: ReconnectReason): Promise<ReconnectResult> => {
    if (reconnectingRef.current) return "in-progress";
    if (!resumeHandleRef.current || !hasConnectedRef.current) return "unavailable";
    const attempt = connectionAttempt.current;
    const isCurrent = () => connectionAttempt.current === attempt;
    reconnectingRef.current = true;
    setReconnecting(true);
    const previous = sessionPromiseRef.current;
    const startedAt = Date.now();
    try {
      for (let tries = 0; ; tries += 1) {
        // Bounded by elapsed time, not just the schedule: each try can spend a
        // token request and a setup wait.
        const delay = nextReconnectDelay(tries, Date.now() - startedAt);
        if (delay === null) return "failed";
        await new Promise(resolve => setTimeout(resolve, delay));
        if (!isCurrent()) return "ended";
        let pending: Promise<Session> | undefined;
        try {
          const result = await fetchEphemeralToken(voiceTokenParams({
            memoryId: memoryIdRef.current,
            tools: callSetupRef.current.wantsTools,
            resumeHandle: resumeHandleRef.current,
            callTicket: callTicketRef.current,
          }));
          if (!isCurrent()) return "ended";
          const liveToken = result?.data as LiveToken | undefined;
          if (!liveToken?.token) throw new Error("Failed to get a fresh Live API token");
          const socket = openSocket(liveToken, callSetupRef.current.overrides, attempt, false);
          pending = socket.sessionPromise;
          await withDeadline(Promise.all([socket.sessionPromise, socket.setupReady]), VOICE_RESUME_SETUP_TIMEOUT_MS, "Voice reconnect timed out.");
          if (!isCurrent()) {
            void pending.then(session => session.close()).catch(() => {});
            return "ended";
          }
          activeSocketRef.current = socket.socketId;
          sessionPromiseRef.current = socket.sessionPromise;
          socketOpenRef.current = true;
          void previous?.then(session => session.close()).catch(() => {});
          // The server's count is the clock: restart the timers from it.
          scheduleCallLimit(liveToken);
          // A turn cut off by the swap may never complete; keep what was said.
          flushTranscript("interrupted");
          console.info("[voice] reconnected", { reason, tries });
          return "reconnected";
        } catch (error) {
          void pending?.then(session => session.close()).catch(() => {});
          if (isCallTimeUp(error) || isFreeVoiceMinutesUp(error)) {
            // Retrying cannot help: the call's time, or the month's free minutes, are up.
            callTimeUpRef.current = isCallTimeUp(error) ? CALL_TIME_UP_MESSAGE : FREE_MINUTES_UP_MESSAGE;
            return "failed";
          }
          console.warn("[voice] reconnect attempt failed", { reason, tries, error });
        }
      }
    } finally {
      reconnectingRef.current = false;
      setReconnecting(false);
    }
  }, [fetchEphemeralToken, flushTranscript, openSocket, scheduleCallLimit]);
  reconnectRef.current = reconnect;

  /** The active connection closed: carry the call over if Gemini gave a handle, else end it. */
  const handleConnectionLost = useCallback(async (socketId: number, message: string | null) => {
    if (socketId !== activeSocketRef.current || reconnectingRef.current) return;
    if (hasConnectedRef.current && resumeHandleRef.current) {
      const result = await reconnect("connection-lost");
      if (result === "reconnected" || result === "in-progress" || result === "ended") return;
      message = callTimeUpRef.current ?? VOICE_CONNECTION_LOST;
    }
    endLostCall(message);
  }, [endLostCall, reconnect]);
  connectionLostRef.current = handleConnectionLost;

  // Back online: the old connection may be dead without saying so.
  useEffect(() => {
    const onOnline = () => {
      if (!hasConnectedRef.current) return;
      void reconnectRef.current("network-change").then(endIfReconnectFailedRef.current);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const disconnect = useCallback(() => {
    ++connectionAttempt.current;
    clearCallLimit();
    callTicketRef.current = null;
    stopVoiceTools();
    stopTurnTaking();
    cancelSetup.current?.();
    cancelSetup.current = null;
    isConnectingRef.current = false;
    setConnected(false);
    hasConnectedRef.current = false;
    socketOpenRef.current = false;
    resumeHandleRef.current = null;
    sessionPromiseRef.current?.then((session) => session.close()).catch(console.error);
    sessionPromiseRef.current = null;
    // Free plans: the call used some of the month's voice minutes.
    void mutate(endpoint.billingSubscription).catch(() => undefined);
    // Don't close audio contexts here - they're managed by the cleanup
  }, [clearCallLimit, stopTurnTaking, stopVoiceTools]);

  const restartSession = useCallback(async (overrides: LiveSessionOverrides = {}) => {
    setInputMuted(true);
    disconnect();
    await connect(overrides);
    setInputMuted(false);
  }, [connect, disconnect, setInputMuted]);

  const resumeAudio = useCallback(async () => {
    const output = outputAudioContextRef.current;
    if (!output || output.state === "closed") return;
    await output.resume();
    setAudioPaused(output.state !== "running");
  }, []);

  useEffect(() => {
    // Fast Refresh preserves hook state while replacing the audio graph.
    // Never leave a disconnected graph advertised as an active call.
    hasConnectedRef.current = false;
    isConnectingRef.current = false;
    isRecordingRef.current = false;
    setConnected(false);
    setIsRecording(false);
    const inputCtx = new ((window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)({
      sampleRate: 16000,
    });

    const outputCtx = new ((window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)({
      sampleRate: 24000,
    });
    inputAudioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;
    playbackStateRef.current = createPlaybackState(outputCtx);
    outputCtx.onstatechange = () => setAudioPaused(outputCtx.state !== "running");
    setAudioPaused(outputCtx.state !== "running");

    const inNode = inputCtx.createGain();
    const outNode = outputCtx.createGain();
    outNode.connect(outputCtx.destination);
    setInputNode(inNode);
    setOutputNode(outNode);

    return () => {
      // This is a cancellation counter, not a captured DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++connectionAttempt.current;
      relayRef.current?.dispose();
      relayRef.current = null;
      if (pendingEndRef.current) clearTimeout(pendingEndRef.current.timer);
      pendingEndRef.current = null;
      if (selfInterruptTimerRef.current) clearTimeout(selfInterruptTimerRef.current);
      selfInterruptTimerRef.current = null;
      cancelSetup.current?.();
      cancelSetup.current = null;
      isRecordingRef.current = false;
      hasConnectedRef.current = false;
      isConnectingRef.current = false;
      outputCtx.onstatechange = null;
      // Leaving mid-call still saves what was said.
      finishCallRecordingRef.current();
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      scriptProcessorNodeRef.current?.disconnect();
      sourceNodeRef.current?.disconnect();
      if (playbackStateRef.current) stopAllGeminiLivePlayback(playbackStateRef.current);
      inputAudioContextRef.current = null;
      outputAudioContextRef.current = null;
      sessionPromiseRef.current?.then((session) => session.close()).catch(() => {});
      inputCtx.close().catch(console.error);
      outputCtx.close().catch(console.error);
      ephemeralTokenRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!autoConnect) return;
    if (
      outputNode &&
      !hasConnectedRef.current &&
      !connected &&
      !isConnectingRef.current
    ) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputNode, connected, autoConnect]);

  const greet = useCallback(async () => {
    const session = await sessionPromiseRef.current;
    if (!isRecordingRef.current) return;
    startAiTurn();
    session?.sendClientContent({
      turns: [{ role: "user", parts: [{ text: "Begin our voice conversation with a brief warm greeting and one gentle question based on the context you have. Keep it short." }] }],
      turnComplete: true,
    });
  }, [startAiTurn]);

  return {
    sendChatInput,
    audioPaused,
    resumeAudio,
    greet,
    connected,
    /** The call is being carried over to a new connection; it continues on its own. */
    reconnecting,
    /** Gemini heard the host and Memento is working on a reply. */
    thinking,
    connect,
    disconnect,
    restartSession,
    startRecording,
    stopRecording,
    setInputMuted,
    isRecording,
    /** This call is being recorded and will be saved to Stories. */
    isRecordingCall,
    error,
    inputNode,
    outputNode
  };
}
