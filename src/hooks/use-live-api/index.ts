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
  type GeminiLivePlaybackState,
} from "./playback";
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
}

export type LiveSessionOverrides = {
  languageCode?: string;
  voiceName?: string;
};

export function useLiveAPI({
  memoryId,
  turns = [],
  languageCode = "en-US",
  autoConnect = false,
  onMessages,
}: UseLiveAPIProps) {
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
      const result = await fetchEphemeralToken(
        memoryIdRef.current ? { memory_id: memoryIdRef.current } : undefined,
      );
      if (outputAudioContextRef.current !== outputAudioContext || connectionAttempt.current !== attempt) return false;
      const liveToken = result?.data as { token?: string; live?: { model?: string } } | undefined;
      if (!liveToken?.token) {
        throw new Error("Failed to get a fresh Live API token");
      }
      ephemeralTokenRef.current = liveToken.token;

      clientRef.current = new GoogleGenAI({
        apiKey: ephemeralTokenRef.current,
        httpOptions: { apiVersion: 'v1alpha' }
      });

      if (!clientRef.current) {
        throw new Error("Failed to initialize Gemini client");
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

      let acceptSetup!: () => void;
      let rejectSetup!: (error: Error) => void;
      const setupReady = new Promise<void>((resolve, reject) => {
        acceptSetup = resolve;
        rejectSetup = reject;
      });
      cancelSetup.current = () => rejectSetup(new Error("Voice connection cancelled"));
      setupTimer = setTimeout(() => rejectSetup(new Error("Voice connection timed out. Please try again.")), 20000);
      const isCurrent = () => connectionAttempt.current === attempt;
      sessionPromiseRef.current = clientRef.current.live.connect({
        // The token is constrained to the server's model; any other model is rejected.
        model: liveToken.live?.model || GEMINI_CONFIG.MODEL,
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            if (!isCurrent()) return;
            if (message.setupComplete) {
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
            const parts = message.serverContent?.modelTurn?.parts;
            const playback = playbackStateRef.current;

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
            setError(failure.message);
            stopRecording();
            if (playbackStateRef.current) stopAllGeminiLivePlayback(playbackStateRef.current);
            setConnected(false);
            hasConnectedRef.current = false;
          },
          onclose: (event: CloseEvent) => {
            if (!isCurrent()) return;
            const detail = event.reason || "The voice connection closed. Please try again.";
            const failure = new Error(`Voice connection closed (${event.code}): ${detail}`);
            rejectSetup(failure);
            if (event.code !== 1000 || !hasConnectedRef.current) setError(failure.message);
            stopRecording();
            if (playbackStateRef.current) stopAllGeminiLivePlayback(playbackStateRef.current);
            setConnected(false);
            isConnectingRef.current = false;
            hasConnectedRef.current = false;
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

      const pendingSession = sessionPromiseRef.current;
      // The SDK resolves on socket open, before Gemini accepts the setup.
      void pendingSession.then(session => {
        if (!isCurrent()) session.close();
      }).catch(() => {});
      const [session] = await Promise.all([pendingSession, setupReady]);
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
    stopRecording,
    updateTranscriptText,
    flushTranscript,
    user?.chat_voice,
    user?.chat_voice_provider,
    context,
    outputNode,
    fetchEphemeralToken,
    languageCode,
    turns,
  ]);

  const disconnect = useCallback(() => {
    ++connectionAttempt.current;
    cancelSetup.current?.();
    cancelSetup.current = null;
    isConnectingRef.current = false;
    setConnected(false);
    hasConnectedRef.current = false;
    sessionPromiseRef.current?.then((session) => session.close()).catch(console.error);
    sessionPromiseRef.current = null;
    // Don't close audio contexts here - they're managed by the cleanup
  }, []);

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
