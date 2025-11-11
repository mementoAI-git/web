"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utility";

interface AudioVisualizerProps {
  recorder?: MediaRecorder | null;
  isRecording?: boolean;
  stream?: MediaStream | null;
  color?: string;
  className?: string;
  barCount?: number;
  maxHeight?: number;
}

export default function AudioVisualizer({
  stream = null,
  isRecording = false,
  color = "#3C3F3E",
  className = "",
  barCount = 5,
  maxHeight = 24,
}: AudioVisualizerProps) {
  const [levels, setLevels] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const setupAudio = useCallback(async () => {
    if (!stream) return;

    try {
      cleanup();

      audioContextRef.current = new window.AudioContext();

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.3;

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current || !isRecording) {
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const newLevels: number[] = [];
        const binCount = analyserRef.current.frequencyBinCount;
        const startBin = Math.floor(binCount * 0.05);
        const endBin = Math.floor(binCount * 0.6);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          let count = 0;
          const barStartBin = startBin + Math.floor(((endBin - startBin) * i) / barCount);
          const barEndBin = startBin + Math.floor(((endBin - startBin) * (i + 1)) / barCount);

          for (let j = barStartBin; j < barEndBin && j < dataArrayRef.current.length; j++) {
            sum += dataArrayRef.current[j];
            count++;
          }

          if (count > 0) {
            const average = sum / count;
            const normalizedLevel = Math.pow(average / 255, 0.8) * maxHeight;
            const responsiveLevel = Math.max(normalizedLevel, average > 10 ? normalizedLevel * 1.5 : 0);
            newLevels.push(responsiveLevel);
          } else {
            newLevels.push(0);
          }
        }

        const evenIndexes = Array.from({ length: barCount }, (_, i) => i)
          .filter((i) => i % 2 === 0)
          .sort((a, b) => b - a);

        const oddIndexes = Array.from({ length: barCount }, (_, i) => i)
          .filter((i) => i % 2 === 1 && !evenIndexes.includes(i))
          .sort((a, b) => a - b);

        const rearrangedPattern = [...evenIndexes, ...oddIndexes];

        const finalLevels: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const patternIndex = rearrangedPattern[i];
          finalLevels.push(newLevels[patternIndex] || 0);
        }

        setLevels(finalLevels);
        animationRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (error) {
      console.error("Error setting up audio:", error);
      setLevels(new Array(barCount).fill(0));
    }
  }, [stream, isRecording, barCount, maxHeight, cleanup]);

  useEffect(() => {
    if (stream && isRecording) {
      setupAudio();
    } else {
      setLevels(new Array(barCount).fill(0));
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return cleanup;
  }, [stream, isRecording, setupAudio, barCount, cleanup]);

  useEffect(() => {
    setLevels(new Array(barCount).fill(0));
  }, [barCount]);

  return (
    <div className={cn("flex aspect-square w-8 items-center justify-center rounded-full bg-grey-400", className)}>
      <div className="flex h-3 items-center gap-0.5">
        {levels.map((level, index) => (
          <div
            key={index}
            style={{
              height: `${Math.max(level, 2)}px`,
              minHeight: "3px",
              maxHeight: `${maxHeight}px`,
              transition: isRecording ? "height 0.05s ease-out" : "height 0.2s ease-in-out",
              background: color,
              opacity: isRecording ? 1 : 0.3,
            }}
            className="w-0.5 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
