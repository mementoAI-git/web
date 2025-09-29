"use client"
import TImesMarkIcon from "@/public/icon/times.svg"
import MicOffIcon from "@/public/icon/mic-off.svg"
import MicIcon from "@/public/icon/mic.svg"
import { createPortal } from "react-dom"
import { cn } from "@/utility"
import { useEffect, useRef, useState } from "react";
import { useLiveAPI } from "@/hooks/use-live-api";
import { Visual3D } from "./AudioVisual3D"
// Props interface
interface VoiceinputProps {
  onCancel: () => void
  memoryId?: string | null
  history?: { role: "user" | "ai", text: string }[]
}

export default function Voiceinput({ onCancel, memoryId, history = [] }: VoiceinputProps) {
  const {
    connected,
    connect,
    startRecording,
    stopRecording,
    inputNode,
    outputNode,
    isRecording
  } = useLiveAPI({ memoryId, turns: history });

  const [muted, setMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect - start when connected, stop when disconnected
  useEffect(() => {
    if (isRecording) {
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
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle recording function - handles connection, muting, and unmuting
  const toggleRecording = async () => {
    if (!connected) await connect();

    if (connected && !isRecording) {
      setMuted(false);
      setRecordingTime(0);
      await startRecording();
    } else {
      setMuted(p => !p);
    }
  };

  // Handle cancel - disconnect and close
  const handleCancel = async () => {
    if (isDisconnecting) return; // Prevent multiple clicks
    setIsDisconnecting(true);

    try {
      // Stop recording if active
      if (isRecording) {
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
        await stopRecording();

        // Wait a bit more to ensure disconnect is fully processed
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      onCancel();
    } catch (error) {
      console.error(error)
      onCancel();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return createPortal(
    <div className="fixed border bg-background h-screen w-screen top-0 bottom-0 right-0 left-0 flex justify-center items-center">
      <div className="space-y-10 flex flex-col justify-center items-center">
        <div className="space-y-6 flex flex-col justify-center items-center">
          {/* Audio indicator with volume visualization */}
          {/* <div className="relative size-30 rounded-full border-2 border-blue-6 flex items-center justify-center">
            <AudioPulse active={isRecording} volume={volume} />
          </div> */}

          <div className="relative overflow-hidden rounded-full size-[120px]">
            <Visual3D {...{ inputNode, outputNode }} />
          </div>

          <span className="font-georgia text-2xl text-center text-sand-12 block">
            {formatTime(recordingTime)}
          </span>
        </div>

        <div className="flex gap-6 items-center">
          <div
            onClick={toggleRecording}
            className={cn(
              "icon-container !text-blue-6 !rounded-xl cursor-pointer transition-all !bg-blue-2 hover:!bg-blue-3", {
              "!bg-red-2 hover:!bg-red-3 !text-sand-8": connected && isRecording && !muted, // Recording and unmuted
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
