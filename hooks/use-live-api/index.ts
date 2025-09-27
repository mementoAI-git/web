import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { AudioStreamer } from "@/lib/audio-streamer";
import { audioContext } from "@/lib/utils";
import VolMeterWorket from "@/lib/worklets/vol-meter";

// Transcript entry type
export type TranscriptEntry = {
  _id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
};

export type LiveConfig = {
  model: string;
  systemInstruction?: string;
  responseModalities?: Modality[];
  speechConfig?: {
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName?: string;
      };
    };
  };
  tools?: any[];
};

export type UseLiveAPIResults = {
  client: GoogleGenAI;
  session: any;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  transcript: TranscriptEntry[];
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
};

export function useLiveAPI(apiKey?: string): UseLiveAPIResults {
  const client = useMemo(() => {
    if (!apiKey) {
      throw new Error("API key is required for Google GenAI SDK");
    }
    return new GoogleGenAI({ apiKey });
  }, [apiKey]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [config, setConfig] = useState<LiveConfig>({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    systemInstruction: "You are a helpful assistant.",
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Aoede"
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

  // Initialize audio context and worklet
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Load audio worklet for volume monitoring
        try {
          await audioContext.audioWorklet.addModule('/worklets/vol-meter.js');
        } catch (error) {
          console.warn('Audio worklet not available, using fallback volume monitoring');
        }
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Connect to Live API
  const connect = useCallback(async () => {
    console.log("Connecting to Live API....");
    if (sessionRef.current) {
      return; // Already connected
    }

    if (!apiKey) {
      throw new Error("API key is required to connect to Live API");
    }

    try {
      const session = await client.live.connect({
        model: config.model,
        callbacks: {
          onopen: () => {
            console.log('Live API connected');
            setConnected(true);
          },
          onmessage: (message: any) => {
            console.log(message);
            // Handle AI responses
            if (message.serverContent && message.serverContent.modelTurn) {
              const parts = message.serverContent.modelTurn.parts;
              if (parts && parts.length > 0) {
                const textParts = parts
                  .filter((part: any) => part.text)
                  .map((part: any) => part.text)
                  .join(' ');

                if (textParts.trim()) {
                  addTranscriptEntry({
                    _id: Date.now().toString(),
                    role: 'ai',
                    text: textParts,
                    timestamp: Date.now()
                  });
                }
              }
            }

            // Handle audio data
            if (message.data) {
              // Play audio response
              if (audioContextRef.current) {
                try {
                  const audioBuffer = audioContextRef.current.createBuffer(1, 1024, 24000);
                  const source = audioContextRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContextRef.current.destination);
                  source.start();
                } catch (error) {
                  console.warn('Failed to play audio:', error);
                }
              }
            }
          },
          onerror: (error: any) => {
            console.error('Live API error:', error);
            setConnected(false);
          },
          onclose: () => {
            console.log('Live API disconnected');
            setConnected(false);
          }
        },
        config: {
          responseModalities: config.responseModalities,
          systemInstruction: config.systemInstruction,
          speechConfig: config.speechConfig,
          tools: config.tools
        }
      });

      sessionRef.current = session;

      // Start audio recording
      await startAudioRecording();
    } catch (error) {
      console.error('Failed to connect to Live API:', error);
      setConnected(false);
    }
  }, [client, config, addTranscriptEntry, apiKey]);

  // Start audio recording
  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      audioStreamRef.current = stream;

      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);

        // Try to create audio worklet for volume monitoring
        try {
          const worklet = new AudioWorkletNode(audioContextRef.current, 'vol-meter');
          worklet.port.onmessage = (event) => {
            setVolume(event.data.volume);
          };

          source.connect(worklet);
          audioWorkletRef.current = worklet;
        } catch (error) {
          console.warn('Audio worklet not available, using fallback');
        }

        // Process audio data and send to Live API
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          if (sessionRef.current && connected) {
            const inputBuffer = event.inputBuffer;
            const audioData = inputBuffer.getChannelData(0);

            // Calculate volume for fallback
            let sum = 0;
            for (let i = 0; i < audioData.length; i++) {
              sum += audioData[i] * audioData[i];
            }
            const rms = Math.sqrt(sum / audioData.length);
            setVolume(rms);

            // Convert float32 to int16 PCM
            const pcmData = new Int16Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
            }

            // Convert to base64
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));

            // Send to Live API
            try {
              sessionRef.current.sendRealtimeInput({
                audio: {
                  data: base64Audio,
                  mimeType: "audio/pcm;rate=16000"
                }
              });
            } catch (error) {
              console.warn('Failed to send audio data:', error);
            }
          }
        };

        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
        processorRef.current = processor;
      }
    } catch (error) {
      console.error('Failed to start audio recording:', error);
    }
  }, [connected]);

  // Disconnect from Live API
  const disconnect = useCallback(async () => {
    try {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }

      // Stop audio recording
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      if (audioWorkletRef.current) {
        audioWorkletRef.current.disconnect();
        audioWorkletRef.current = null;
      }

      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      setConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from Live API:', error);
    }
  }, []);

  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    clearTranscript
  };
}
