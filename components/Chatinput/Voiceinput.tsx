"use client"
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import TImesMarkIcon from "@/public/icon/times.svg"
import MicOffIcon from "@/public/icon/mic-off.svg"
import MicIcon from "@/public/icon/mic.svg"
import { createPortal } from "react-dom"
import { cn } from "@/utility"
import { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "@/hooks/use-live-api/context";
import { AudioRecorder } from "@/lib/audio-recorder";
import { v4 as uuid } from "uuid"
import AudioPulse from "../AudioPulse"

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

const systemInstruction = `You are my personal assistant biographer—your role is to help document, reflect on, and narrate the story of my life with depth and care. Observe my experiences, interests, and memories, and weave them into thoughtful summaries, analyses, or creative reflections. Act as a curator of my personal history: attentive, insightful, and discreet.

For example:

If I share a meaningful event, help me unpack its significance.

If I mention a recurring habit or passion, highlight patterns or connections.

Surprise me with reflective questions or observations to deepen my self-awareness.

Your tone should be warm, professional, and tailored to my voice—whether analytical, poetic, or casual. Prioritize understanding over assumptions, and always invite me to expand (but never pry).`

// Transcript entry type
type TranscriptEntry = {
  _id: string;
  role: 'user' | 'ai';
  text: string;
};

// Props interface
interface VoiceinputProps {
  onCancel: () => void;
  onTranscriptEntry?: (transcript: TranscriptEntry) => void;
}

export default function Voiceinput({ onCancel, onTranscriptEntry }: VoiceinputProps) {
  const { client, connect, setConfig, connected, disconnect } = useLiveAPIContext();
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [inVolume, setInVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add entry to transcript and notify parent
  const addToTranscript = (role: 'user' | 'ai', text: string) => {
    console.log(role, text)
    onTranscriptEntry?.({
      _id: uuid(),
      role,
      text
    });
  };

  // Timer effect - start when connected, stop when disconnected
  useEffect(() => {
    if (connected) {
      // Start timer when connected
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Stop timer when disconnected
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connected]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle recording function - handles connection, muting, and unmuting
  const toggleRecording = async () => {
    if (!connected) {
      // Not connected - connect and start recording
      setIsRecording(true);
      setMuted(false);
      setRecordingTime(0); // Reset timer when starting new connection
      await connect();
    } else if (connected && !isRecording) {
      // Connected but not recording - start recording
      setIsRecording(true);
      setMuted(false);
    } else if (connected && isRecording && !muted) {
      // Recording and not muted - mute the recording
      setMuted(true);
    } else if (connected && isRecording && muted) {
      setMuted(false);
    }
  };

  // Handle cancel - disconnect and close
  const handleCancel = async () => {
    if (isDisconnecting) return; // Prevent multiple clicks
    setIsDisconnecting(true);

    try {
      // Stop recording if active
      if (isRecording) {
        setIsRecording(false);
        setMuted(true);
      }

      // Clear timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Disconnect from AI (this should work regardless of recording state)
      if (connected) {
        // Wait for disconnect to complete
        await disconnect();

        // Wait a bit more to ensure disconnect is fully processed
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      onCancel();
    } catch (error) {
      console.log(error)
      onCancel();
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  // Listen for AI responses and add to transcript
  useEffect(() => {
    const onContent = (content) => {
      if (content.modelTurn && content.modelTurn.parts) {
        const textParts = content.modelTurn.parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join(' ');

        if (textParts.trim()) {
          addToTranscript('ai', textParts);
        }
      }
    };

    client.on("content", onContent);
    return () => {
      client.off("content", onContent);
    };
  }, [client]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  return createPortal(
    <div className="fixed border bg-background h-screen w-screen top-0 bottom-0 right-0 left-0 flex justify-center items-center">
      <div className="space-y-10 flex flex-col justify-center items-center">
        <div className="space-y-6 flex flex-col justify-center items-center">
          {/* Audio indicator with volume visualization */}
          <div className="relative size-30 rounded-full border-2 border-blue-6 flex items-center justify-center">
            <AudioPulse active={isRecording} volume={inVolume} />
          </div>

          <span className="font-georgia text-2xl text-center text-sand-12 block">
            {formatTime(recordingTime)}
          </span>
          {muted && <span className="font-inter w-full text-center text-xs text-[#F04438]">Voice muted</span>}
        </div>

        <div className="flex gap-6 items-center">
          <div
            onClick={toggleRecording}
            className={cn(
              "icon-container !rounded-xl cursor-pointer transition-all !bg-blue-2 hover:!bg-blue-3", {
              "!bg-red-2 hover:!bg-red-3 text-blue-6": connected && isRecording && !muted, // Recording and unmuted
              "!bg-[#FEE4E2] hover:!bg-yellow-3": connected && isRecording && muted, // Recording but muted
            })
            }
          >
            {connected && isRecording && muted ? (
              <MicOffIcon className="size-5 stroke-2 text-[#F97066]" />
            ) : (
              <MicIcon className="size-5" />
            )}
          </div>

          <div
            onClick={handleCancel}
            className={cn(
              "icon-container !rounded-xl cursor-pointer transition-all",
              isDisconnecting
                ? "!bg-gray-2 hover:!bg-gray-2 cursor-not-allowed"
                : "!bg-[#FEE4E2] hover:!bg-red-3"
            )}
          >
            {isDisconnecting ? (
              <div className="size-4 border-2 border-gray-6 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TImesMarkIcon className="size-4 text-[#F97066]" />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}