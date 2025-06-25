"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface IVoiceWaveform {
  stream: MediaStream | null;
  isRecording: boolean;
  color?: string;
  barCount?: number;
  maxHeight?: number;
}

export default function VoiceWaveform({
  stream = null,
  isRecording = false,
  color = "#667085",
  barCount = 20,
  maxHeight = 40
}: IVoiceWaveform) {
  const [levels, setLevels] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const setupAudio = useCallback(() => {
    if (!stream) return;

    try {
      audioContextRef.current = new window.AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // Higher resolution for smoother waveform
      analyserRef.current.smoothingTimeConstant = 0.8; // Smooth transitions

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
          // Create a more dynamic range with exponential scaling
          const normalizedLevel = Math.pow(average / 255, 1.5) * maxHeight;
          newLevels.push(normalizedLevel);
        }

        setLevels(newLevels);
        animationRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  }, [stream, isRecording, barCount, maxHeight]);

  useEffect(() => {
    if (stream && isRecording) {
      setupAudio();
    } else {
      // Reset levels when not recording
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
  }, [stream, isRecording, setupAudio, barCount]);

  // Initialize levels array
  useEffect(() => {
    setLevels(new Array(barCount).fill(0));
  }, [barCount]);

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {levels.map((level, i) => (
        <div
          key={i}
          style={{
            height: `${Math.max(level, 2)}px`,
            minHeight: '2px',
            maxHeight: `${maxHeight}px`,
            transition: isRecording ? 'height 0.1s ease-out' : 'height 0.3s ease-in-out',
            background: color,
            opacity: isRecording ? 1 : 0.3
          }}
          className="w-1 rounded-full"
        />
      ))}
    </div>
  );
} 