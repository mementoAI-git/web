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
import { post } from "@/api/mutations";
import { voiceToolsEnabled, voiceTokenParams } from "@/features/voice/tools/capabilities";
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
import { createBlob } from "./utils";
import { GEMINI_CONFIG } from "./config";
import { createSystemContext, isEmpty } from "@/utility";
import useFetcher from "../use-fetcher";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
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
};

export type LiveSessionOverrides = {
  languageCode?: string;
  voiceName?: string;
};

type LiveToken = { token?: string; live?: { model?: string }; tools?: unknown };

const VOICE_CONNECTION_LOST = "The voice connection was lost. Please start the call again.";

export function useLiveAPI({
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
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const transcriptText = useRef({ user: "", ai: "" })

  const turnTimerRef = useRef({
    duration: 0,
    startTime: null,
    interval: null
  });

  const context = useMemo(() => createSystemContext(user), [user]);

  const { trigger: fetchEphemeralToken } = useFetcher(endpoint.ephemeralToken, "get")
  const { trigger: addMessageToMemory } = useFetcher(endpoint.addMessageToMemory, "post")

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

        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({
            audio: createBlob(pcmData)
          });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);
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
  }, [inputNode]);

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
      const response = await addMessageToMemory({ memory_id: memoryIdRef.current, session_id: sessionIdRef.current, messages });
      const saved = response?.data;
      if (!Array.isArray(saved)) throw new Error("Could not save the voice conversation.");
      if (saved[0]?.memory) memoryIdRef.current = String(saved[0].memory);
      return saved;
    });
    saveQueue.current = job;
    return job;
  }, [addMessageToMemory]);

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
    startTurnTimer();
  }, [startAiTurn, startTurnTimer]);

  const flushTranscript = useCallback((stopReason: "end_turn" | "interrupted" = "end_turn") => {
    const messages = Object.entries(transcriptText.current)
      .filter(([, text]) => text.trim() && !text.match(/<noise>/))
      .map(([role, text]) => ({ role, text, is_voice: true, duration: turnTimerRef.current.duration }));
    const turnStartedAt = turnStartedAtRef.current;
    const firstResponseAt = firstResponseAtRef.current;
    transcriptText.current = { user: "", ai: "" };
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
  }, [recordMessages, startAiTurn]);

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

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = undefined;

    stopTurnTimer(); // Stop timer on disconnect
    turnStartedAtRef.current = null;
    firstResponseAtRef.current = null;
    setConnected(false);
    isConnectingRef.current = false;

    setStatus('Recording stopped. Click Start to begin again.');
  }, [stopTurnTimer]);

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
          if (handle) resumeHandleRef.current = handle;
          // Gemini is about to close this connection; carry the call over first.
          if (message.goAway) void reconnectRef.current("go-away").then(endIfReconnectFailedRef.current);

          const parts = message.serverContent?.modelTurn?.parts;
          const playback = playbackStateRef.current;

          if (pendingEndRef.current && parts?.some(part => part.inlineData?.data)) {
            pendingEndRef.current.heardGoodbye = true;
          }
          if (message.toolCall?.functionCalls?.length) {
            void relayRef.current?.handle(message.toolCall.functionCalls);
          }
          if (message.toolCallCancellation?.ids?.length) {
            relayRef.current?.cancel(message.toolCallCancellation.ids);
          }

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
          const interrupted = message.serverContent?.interrupted;
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
        systemInstruction: context,
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
    updateTranscriptText,
    flushTranscript,
    user?.chat_voice,
    user?.chat_voice_provider,
    context,
    outputNode,
    languageCode,
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
      const wantsTools = Boolean(toolControlsRef.current) && voiceToolsEnabled();
      const result = await fetchEphemeralToken(
        voiceTokenParams({ memoryId: memoryIdRef.current, tools: wantsTools }),
      );
      if (outputAudioContextRef.current !== outputAudioContext || connectionAttempt.current !== attempt) return false;
      const liveToken = result?.data as LiveToken | undefined;
      if (!liveToken?.token) {
        throw new Error("Failed to get a fresh Live API token");
      }
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
      if (!isEmpty(turns)) {
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
    fetchEphemeralToken,
    turns,
  ]);

  /** The call is over because its connection is gone for good. */
  const endLostCall = useCallback((message: string | null) => {
    if (message) setError(message);
    stopVoiceTools();
    stopRecording();
    if (playbackStateRef.current) stopAllGeminiLivePlayback(playbackStateRef.current);
    setConnected(false);
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    socketOpenRef.current = false;
    resumeHandleRef.current = null;
  }, [stopRecording, stopVoiceTools]);
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
          // A turn cut off by the swap may never complete; keep what was said.
          flushTranscript("interrupted");
          console.info("[voice] reconnected", { reason, tries });
          return "reconnected";
        } catch (error) {
          void pending?.then(session => session.close()).catch(() => {});
          console.warn("[voice] reconnect attempt failed", { reason, tries, error });
        }
      }
    } finally {
      reconnectingRef.current = false;
      setReconnecting(false);
    }
  }, [fetchEphemeralToken, flushTranscript, openSocket]);
  reconnectRef.current = reconnect;

  /** The active connection closed: carry the call over if Gemini gave a handle, else end it. */
  const handleConnectionLost = useCallback(async (socketId: number, message: string | null) => {
    if (socketId !== activeSocketRef.current || reconnectingRef.current) return;
    if (hasConnectedRef.current && resumeHandleRef.current) {
      const result = await reconnect("connection-lost");
      if (result === "reconnected" || result === "in-progress" || result === "ended") return;
      message = VOICE_CONNECTION_LOST;
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
    stopVoiceTools();
    cancelSetup.current?.();
    cancelSetup.current = null;
    isConnectingRef.current = false;
    setConnected(false);
    hasConnectedRef.current = false;
    socketOpenRef.current = false;
    resumeHandleRef.current = null;
    sessionPromiseRef.current?.then((session) => session.close()).catch(console.error);
    sessionPromiseRef.current = null;
    // Don't close audio contexts here - they're managed by the cleanup
  }, [stopVoiceTools]);

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
      cancelSetup.current?.();
      cancelSetup.current = null;
      isRecordingRef.current = false;
      hasConnectedRef.current = false;
      isConnectingRef.current = false;
      outputCtx.onstatechange = null;
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
    connect,
    disconnect,
    restartSession,
    startRecording,
    stopRecording,
    setInputMuted,
    isRecording,
    error,
    inputNode,
    outputNode
  };
}
