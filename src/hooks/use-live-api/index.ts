'use client'

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

// Transcript entry type
export type TranscriptEntry = {
  role: 'user' | 'ai';
  text: string;
};

interface UseLiveAPIProps {
  memoryId?: string | null;
  turns?: { role: "user" | "ai", text: string }[];
  /** When false (default), the session is not opened until `connect()` runs (e.g. user taps “Start call”). */
  autoConnect?: boolean;
}

export function useLiveAPI({
  memoryId,
  turns = [],
  autoConnect = false,
}: UseLiveAPIProps) {
  const { user } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [, setStatus] = useState('');
  const [inputNode, setInputNode] = useState<GainNode | null>(null);
  const [outputNode, setOutputNode] = useState<GainNode | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const ephemeralTokenRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);
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
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;

    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4();
    }

    setIsRecording(true);

    const inputAudioContext = inputAudioContextRef.current;
    if (!inputAudioContext) return;

    await inputAudioContext.resume();
    setStatus('Requesting microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
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
            media: createBlob(pcmData)
          });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContext.destination);
      setStatus('🔴 Recording... Capturing PCM chunks.');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      isRecordingRef.current = false;
      setIsRecording(false);
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

  const updateTranscriptText = useCallback((role: "user" | "ai", text: string, finished = false) => {
    console.log(role, text, finished);
    if (finished) {
      const messages = Object
        .entries(transcriptText.current)
        .filter(([_, text]) => !isEmpty(text) && !text.match(/<noise>/))
        .map(([role, text]) => ({
          role,
          text,
          is_voice: true,
          duration: turnTimerRef.current.duration
        }));

      if (!isEmpty(messages)) {
        addMessageToMemory({
          memory_id: memoryId,
          session_id: sessionIdRef.current,
          messages
        })
      }

      transcriptText.current = {
        user: "",
        ai: ""
      }
      stopTurnTimer(); // Stop timer when turn is complete
      turnTimerRef.current.duration = 0;
      return;
    }

    if (isEmpty(text)) return;
    transcriptText.current[role] += text;
    if (!turnTimerRef.current.interval) {
      startTurnTimer();
    }
  }, [addMessageToMemory, startTurnTimer, stopTurnTimer, memoryId]);

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
    setConnected(false);
    isConnectingRef.current = false;

    setStatus('Recording stopped. Click Start to begin again.');
  }, []);

  // Connect to Live API
  const connect = useCallback(async () => {
    if (!outputAudioContextRef.current) return;

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || connected) {
      return;
    }

    isConnectingRef.current = true;
    const outputAudioContext = outputAudioContextRef.current;

    try {
      if (!ephemeralTokenRef.current) {
        const result = await fetchEphemeralToken();
        if (result?.data?.token) {
          ephemeralTokenRef.current = result.data.token;
        }
      }

      if (!clientRef.current) {
        clientRef.current = new GoogleGenAI({
          apiKey: ephemeralTokenRef.current || undefined,
          httpOptions: { apiVersion: 'v1alpha' }
        });
      }

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

      sessionPromiseRef.current = clientRef.current.live.connect({
        model: GEMINI_CONFIG.MODEL,
        callbacks: {
          onopen: () => {
            setConnected(true);
            isConnectingRef.current = false;
            hasConnectedRef.current = true;
            if (!sessionIdRef.current) {
              sessionIdRef.current = uuidv4();
            }
            turnTimerRef.current.duration = 0;
          },
          onmessage: async (message: LiveServerMessage) => {
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
                    console.error('Failed to play audio response:', error);
                  }
                }
              }
            }

            console.log(message.serverContent);
            console.log("outputTranscription", message.serverContent?.outputTranscription);
            const aiTranscription = message.serverContent?.outputTranscription;
            if (!isEmpty(aiTranscription) || message?.serverContent?.turnComplete) {
              updateTranscriptText(
                "ai",
                aiTranscription?.text,
                message?.serverContent?.turnComplete
              );
            }

            const userTranscription = message.serverContent?.inputTranscription;
            if (!isEmpty(userTranscription) || message?.serverContent?.turnComplete) {
              updateTranscriptText(
                "user",
                userTranscription?.text,
                message?.serverContent?.turnComplete
              );
            }

            // Handle interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted && playbackStateRef.current) {
              stopAllGeminiLivePlayback(playbackStateRef.current);
            }
          },
          onerror: (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            setError(`Live API error: ${message}`);
            setConnected(false);
            isConnectingRef.current = false;
            hasConnectedRef.current = false;
          },
          onclose: () => {
            setConnected(false);
            isConnectingRef.current = false;
            hasConnectedRef.current = false;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: context,
          speechConfig: {
            languageCode: 'en-US',
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName:
                  user?.chat_voice_provider === "gemini"
                    ? (user?.chat_voice || GEMINI_CONFIG.VOICE_CONFIG.voiceName)
                    : GEMINI_CONFIG.VOICE_CONFIG.voiceName
              }
            }
          },
          inputAudioTranscription: {
            languageCode: "en-US",
          },
          outputAudioTranscription: {
            languageCode: "en-US",
          }
        }
      });

      if (!isEmpty(turns)) {
        sessionPromiseRef.current?.then((session) => {
          session.sendClientContent({
            turns: turns.map(({ role, text }) => ({
              role: role === "ai" ? "model" : "user",
              parts: [{ text }]
            })),
            turnComplete: false
          })
        })
      }
    } catch (error) {
      setError(`Connection failed: ${error instanceof Error ? error.message : error}`);
      setConnected(false);
      isConnectingRef.current = false;
      hasConnectedRef.current = false;

      // Clear token on error to force refresh on next attempt
      ephemeralTokenRef.current = null;
    }
  }, [
    updateTranscriptText,
    user?.chat_voice,
    user?.chat_voice_provider,
    context,
    outputNode,
    fetchEphemeralToken,
    connected
  ]);

  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    setConnected(false);
    hasConnectedRef.current = false;
    sessionPromiseRef.current?.then((session) => session.close()).catch(console.error);
    sessionPromiseRef.current = null;
    // Don't close audio contexts here - they're managed by the cleanup
  }, []);

  useEffect(() => {
    const inputCtx = new ((window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)({
      sampleRate: 16000,
    });

    const outputCtx = new ((window as Window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)({
      sampleRate: 24000,
    });
    inputAudioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;
    playbackStateRef.current = createPlaybackState(outputCtx);

    const inNode = inputCtx.createGain();
    const outNode = outputCtx.createGain();
    outNode.connect(outputCtx.destination);
    setInputNode(inNode);
    setOutputNode(outNode);

    return () => {
      sessionPromiseRef.current?.then((session) => session.close());
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

  return {
    connected,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isRecording,
    error,
    inputNode,
    outputNode
  };
}
