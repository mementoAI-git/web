'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenAI, LiveServerMessage, Session, Modality } from "@google/genai";
import { createBlob, decode, decodeAudioData } from "./utils";
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
}

export function useLiveAPI({ memoryId, turns = [] }: UseLiveAPIProps) {
  const { user } = useStore();
  const [isRecording, setIsRecording] = useState(false);
  const [, setStatus] = useState('');
  const [inputNode, setInputNode] = useState<GainNode | null>(null);
  const [outputNode, setOutputNode] = useState<GainNode | null>(null);

  const clientRef = useRef<GoogleGenAI | null>(null);
  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const isRecordingRef = useRef(false);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isConnectingRef = useRef(false);

  const context = useMemo(() => createSystemContext(user), [user]);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptText = useRef({
    user: "",
    ai: ""
  })
  const turnTimerRef = useRef({
    duration: 0,
    startTime: null,
    interval: null
  });

  const { trigger: addMessageToMemory } = useFetcher(endpoint.addMessageToMemory, "post")

  // Start audio recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
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
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setStatus(`Error: ${err.message}`);
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
  }, [addMessageToMemory, startTurnTimer, stopTurnTimer]);

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
    if (!clientRef.current || !outputAudioContextRef.current) return;
    const outputAudioContext = outputAudioContextRef.current;

    try {
      sessionPromiseRef.current = clientRef.current.live.connect({
        model: GEMINI_CONFIG.MODEL,
        callbacks: {
          onopen: () => {
            setConnected(true);
            turnTimerRef.current.duration = 0;
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContext.currentTime,
              );

              try {
                const audioBuffer = await decodeAudioData(
                  decode(audio.data),
                  outputAudioContext,
                  24000,
                  1,
                );

                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode!);

                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (error) {
                console.error('Failed to play audio response:', error);
              }
            }

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
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (error: any) => {
            console.log('Live API error:', error);
            setError(`Live API error: ${error.message || error}`);
            setConnected(false);
            isConnectingRef.current = false;
          },
          onclose: (e: any) => {
            setConnected(false);
            isConnectingRef.current = false;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: context,
          speechConfig: {
            languageCode: 'en-US',
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: user?.chat_voice || "Orus"
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
      console.error('Failed to connect to Live API:', error);
      setError(`Connection failed: ${error instanceof Error ? error.message : error}`);
      setConnected(false);
      isConnectingRef.current = false;
    }
  }, [
    updateTranscriptText,
    user?.chat_voice,
    context,
    outputNode
  ]);

  const disconnect = useCallback(() => {
    sessionPromiseRef.current?.then((session) => session.close());
    inputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current?.close().catch(console.error);
  }, []);

  useEffect(() => {
    const inputCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });

    const outputCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    inputAudioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;
    nextStartTimeRef.current = outputCtx.currentTime;

    const inNode = inputCtx.createGain();
    const outNode = outputCtx.createGain();
    outNode.connect(outputCtx.destination);
    setInputNode(inNode);
    setOutputNode(outNode);

    clientRef.current = new GoogleGenAI({ apiKey: GEMINI_CONFIG.API_KEY });

    return () => {
      sessionPromiseRef.current?.then((session) => session.close());
      inputCtx.close().catch(console.error);
      outputCtx.close().catch(console.error);
    };
  }, []);

  useEffect(() => {
    if (outputNode) {
      connect();
    }
  }, [outputNode, connect]);

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
