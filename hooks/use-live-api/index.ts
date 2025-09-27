'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenAI, LiveServerMessage, Session, Modality, Blob, LiveConnectConfig } from "@google/genai";
import { createBlob, decode, decodeAudioData } from "./utils";
import { GEMINI_CONFIG } from "@/config/gemini";

// Transcript entry type
export type TranscriptEntry = {
  _id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
};

export type UseLiveAPIResults = {
  client: GoogleGenAI;
  session: any;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  isRecording: boolean;
  error: string | null;
};

export function useLiveAPI(): UseLiveAPIResults {
  const client = useMemo(() => {
    if (!GEMINI_CONFIG.API_KEY) {
      throw new Error("API key is required for Google GenAI SDK");
    }
    return new GoogleGenAI({ apiKey: GEMINI_CONFIG.API_KEY });
  }, []);

  const sessionRef = useRef<Session>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isConnectingRef = useRef(false);

  const [connected, setConnected] = useState(false);
  let isRecording = useRef(false).current;
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<LiveConnectConfig>({
    systemInstruction: GEMINI_CONFIG.SYSTEM_INSTRUCTIONS.default,
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Orus"
        }
      }
    }
  });

  // Add transcript entry
  const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
    setTranscript(prev => [...prev, entry]);
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize audio contexts
  const initializeAudioContexts = useCallback(() => {
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
    }

    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }

    if (!outputNodeRef.current && outputAudioContextRef.current) {
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);
    }

    nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
  }, []);

  // Start audio recording
  const startAudioRecording = useCallback(async () => {
    if (
      isRecording ||
      !sessionRef.current ||
      !inputAudioContextRef.current ||
      !outputAudioContextRef.current
    ) {
      return;
    }

    try {
      await inputAudioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      mediaStreamRef.current = stream;
      isRecording = true;

      const sourceNode = inputAudioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      sourceNode.connect(inputAudioContextRef.current.createGain());

      const bufferSize = 256;
      const scriptProcessorNode = inputAudioContextRef.current.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecording || !sessionRef.current) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        // Calculate volume
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i] * pcmData[i];
        }
        const rms = Math.sqrt(sum / pcmData.length);
        setVolume(Math.min(rms * 1000, 100));

        // Send audio data to Live API
        try {
          sessionRef.current.sendRealtimeInput({ media: createBlob(pcmData) });
        } catch (error) {
          console.error('Failed to send audio data:', error);
        }
      };

      sourceNode.connect(scriptProcessorNode);
      scriptProcessorNode.connect(inputAudioContextRef.current.destination);
      scriptProcessorNodeRef.current = scriptProcessorNode;
    } catch (error) {
      setError('Failed to access microphone. Please check permissions.');
      isRecording = false;
    }
  }, [isRecording]);

  // Stop audio recording
  const stopAudioRecording = useCallback(() => {
    if (!isRecording) return;

    isRecording = false;

    if (scriptProcessorNodeRef.current && sourceNodeRef.current && inputAudioContextRef.current) {
      scriptProcessorNodeRef.current.disconnect();
      sourceNodeRef.current.disconnect();
    }

    scriptProcessorNodeRef.current = null;
    sourceNodeRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setVolume(0);
  }, [isRecording]);

  // Connect to Live API
  const connect = useCallback(async () => {
    if (!GEMINI_CONFIG.API_KEY) {
      setError("API key is required to connect to Live API");
      return;
    }

    if (isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;
    clearError();

    try {
      // Initialize audio contexts
      initializeAudioContexts();

      const session = await client.live.connect({
        model: GEMINI_CONFIG.MODEL,
        callbacks: {
          onopen: () => {
            setConnected(true);
            isConnectingRef.current = false;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle audio response
            console.log("message", message);
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;
            console.log("audio", audio);

            if (audio && outputAudioContextRef.current && outputNodeRef.current) {
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContextRef.current.currentTime,
              );

              try {
                const audioBuffer = await decodeAudioData(
                  decode(audio.data),
                  outputAudioContextRef.current,
                  24000,
                  1,
                );

                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current);

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

            // Handle interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }

            if (message?.serverContent?.generationComplete) {
              console.log("AI Response completed");
            }
            if (message?.serverContent?.turnComplete) {
              console.log("User's turn completed");
            }


            // Handle text responses for transcript
            if (message.serverContent?.modelTurn?.parts) {
              const textParts = message.serverContent.modelTurn.parts
                .filter((part: any) => part.text)
                .map((part: any) => part.text)
                .join(' ');
              console.log("textParts", textParts);
              if (textParts.trim()) {
                addTranscriptEntry({
                  _id: Date.now().toString(),
                  role: 'ai',
                  text: textParts,
                  timestamp: Date.now()
                });
              }
            }
          },
          onerror: (error: any) => {
            console.log('Live API error:', error);
            setError(`Live API error: ${error.message || error}`);
            setConnected(false);
            isConnectingRef.current = false;
          },
          onclose: (e: any) => {
            console.log('Live API disconnected:', e.reason);
            setConnected(false);
            isConnectingRef.current = false;
            stopAudioRecording();
          },
        },
        config: {
          responseModalities: config.responseModalities,
          systemInstruction: config.systemInstruction,
          speechConfig: config.speechConfig,
          tools: config.tools,
        }
      });

      sessionRef.current = session;
      await startAudioRecording();
    } catch (error) {
      console.error('Failed to connect to Live API:', error);
      setError(`Connection failed: ${error instanceof Error ? error.message : error}`);
      setConnected(false);
      isConnectingRef.current = false;
    }
  }, [
    client,
    config,
    initializeAudioContexts,
    startAudioRecording,
    stopAudioRecording,
    addTranscriptEntry,
    clearError,
    clearTranscript
  ]);

  // Disconnect from Live API
  const disconnect = useCallback(async () => {
    try {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }

      stopAudioRecording();
      setConnected(false);
      isConnectingRef.current = false;
      clearError();

    } catch (error) {
      setError(`Disconnect failed: ${error instanceof Error ? error.message : error}`);
    }
  }, [stopAudioRecording, clearError]);

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (sessionRef.current) {
  //       sessionRef.current.close();
  //     }
  //     stopAudioRecording();
  //     if (inputAudioContextRef.current) {
  //       inputAudioContextRef.current.close();
  //     }
  //     if (outputAudioContextRef.current) {
  //       outputAudioContextRef.current.close();
  //     }
  //   };
  // }, []);

  // console
  // console.log("is connected", isConnectingRef.current);

  // console.log("sessionRef.current", sessionRef.current.);
  return {
    client,
    session: sessionRef.current,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
    transcript,
    addTranscriptEntry,
    clearTranscript,
    isRecording: isRecording,
    error
  };
}
