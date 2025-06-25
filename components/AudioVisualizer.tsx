"use client";

import { cn } from "@/utility";
import { useCallback, useEffect, useRef, useState } from "react";

interface IAudioVisualizer {
  recorder?: MediaRecorder | null;
  isRecording?: boolean;
  stream?: MediaStream
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
  maxHeight = 24
}: IAudioVisualizer) {
  const [levels, setLevels] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const dataArrayRef = useRef<Uint8Array>(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  const setupAudio = useCallback(() => {
    if (!stream) return;
    try {
      audioContextRef.current = new window.AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current || !isRecording) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const newLevels = [];
        const binCount = analyserRef.current.frequencyBinCount;
        const binSize = Math.floor(binCount / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += dataArrayRef.current[(i * binSize) + j];
          }
          const average = sum / binSize;
          const normalizedLevel = Math.pow(average / 255, 1.5) * maxHeight;
          newLevels.push(normalizedLevel);
        }

        const evenIndexes = Array.from({ length: barCount }, (_, i) => i)
          .filter(i => i % 2 === 0)
          .sort((a, b) => b - a);

        const oddIndexes = Array.from({ length: barCount }, (_, i) => i)
          .filter(i => i % 2 === 1 && !evenIndexes.includes(i))
          .sort((a, b) => a - b);

        const rearrangedPattern = [...evenIndexes, ...oddIndexes];

        const finalLevels = [];
        for (let i = 0; i < barCount; i++) {
          const patternIndex = rearrangedPattern[i];
          finalLevels.push(newLevels[patternIndex] || 0);
        }

        setLevels(finalLevels);
        animationRef.current = requestAnimationFrame(update);
      };

      update()
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  }, [stream, isRecording, barCount, maxHeight])

  useEffect(() => {
    if (stream && isRecording) {
      setupAudio();
    } else {
      setLevels(new Array(barCount).fill(0));
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isRecording, setupAudio, barCount])


  useEffect(() => {
    setLevels(new Array(barCount).fill(0));
  }, [barCount]);

  return (
    <div className={cn("flex aspect-square w-8 items-center justify-center rounded-full bg-grey-400", className)}>
      <div className="flex items-center h-3 gap-0.5">
        {
          levels.map((level, i) => (
            <div
              key={i}
              style={{
                height: `${Math.max(level, 2)}px`,
                minHeight: '3px',
                maxHeight: `${maxHeight}px`,
                transition: isRecording ? 'height 0.1s ease-out' : 'height 0.3s ease-in-out',
                background: color,
                opacity: isRecording ? 1 : 0.3
              }}
              className="rounded-full w-0.5"
            />
          ))
        }
      </div>
    </div>
  );
}
