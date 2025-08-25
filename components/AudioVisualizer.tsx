"use client";

import { cn } from "@/utility";
import { useCallback, useEffect, useRef, useState } from "react";

interface IAudioVisualizer {
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
  maxHeight = 24
}: IAudioVisualizer) {
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

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const setupAudio = useCallback(async () => {
    if (!stream) return;

    try {
      // Clean up any existing audio context
      cleanup();

      audioContextRef.current = new window.AudioContext();

      // Handle suspended state (required by modern browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      // Increase FFT size for better frequency resolution and responsiveness
      analyserRef.current.fftSize = 512;
      // Reduce smoothing for more responsive visualization (lower = more responsive)
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

        const newLevels = [];
        const binCount = analyserRef.current.frequencyBinCount;

        // Use more frequency bins per bar for better sensitivity
        const binSize = Math.max(1, Math.floor(binCount / (barCount * 2)));

        // Focus on mid-range frequencies (100Hz - 4kHz) for better speech/voice detection
        const startBin = Math.floor(binCount * 0.05); // Skip very low frequencies
        const endBin = Math.floor(binCount * 0.6);   // Focus on speech range

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          let count = 0;

          // Calculate frequency range for this bar
          const barStartBin = startBin + Math.floor((endBin - startBin) * i / barCount);
          const barEndBin = startBin + Math.floor((endBin - startBin) * (i + 1) / barCount);

          for (let j = barStartBin; j < barEndBin && j < dataArrayRef.current.length; j++) {
            sum += dataArrayRef.current[j];
            count++;
          }

          if (count > 0) {
            const average = sum / count;
            // More aggressive normalization curve for better responsiveness
            const normalizedLevel = Math.pow(average / 255, 0.8) * maxHeight;
            // Add minimum movement for very low volumes
            const responsiveLevel = Math.max(normalizedLevel, average > 10 ? normalizedLevel * 1.5 : 0);
            newLevels.push(responsiveLevel);
          } else {
            newLevels.push(0);
          }
        }

        // Create a visual pattern: even indexes in reverse order, then odd indexes
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

      update();
    } catch (error) {
      console.error("Error setting up audio:", error);
      // Reset to default state on error
      setLevels(new Array(barCount).fill(0));
    }
  }, [stream, isRecording, barCount, maxHeight, cleanup]);

  useEffect(() => {
    if (stream && isRecording) {
      setupAudio();
    } else {
      setLevels(new Array(barCount).fill(0));
      // Stop animation when not recording
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
      <div className="flex items-center h-3 gap-0.5">
        {levels.map((level, i) => (
          <div
            key={i}
            style={{
              height: `${Math.max(level, 2)}px`,
              minHeight: '3px',
              maxHeight: `${maxHeight}px`,
              // Faster transitions for more responsive feel
              transition: isRecording ? 'height 0.05s ease-out' : 'height 0.2s ease-in-out',
              background: color,
              opacity: isRecording ? 1 : 0.3
            }}
            className="rounded-full w-0.5"
          />
        ))}
      </div>
    </div>
  );
}
