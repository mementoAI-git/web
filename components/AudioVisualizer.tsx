"use client";

import { useEffect, useRef, useState } from "react";

interface IAudioVisualizer {
  recorder: MediaRecorder | null;
  stream?: MediaStream
  color?: string;
}

export default function AudioVisualizer({ stream = null, color = "#3C3F3E" }: IAudioVisualizer) {
  const [levels, setLevels] = useState([0, 0, 0, 0, 0]);
  const audioContextRef = useRef<AudioContext>(null);
  const analyserRef = useRef<AnalyserNode>(null);
  const dataArrayRef = useRef<Uint8Array>(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  const setupAudio = () => {
    if (!stream) return;
    try {
      audioContextRef.current = new window.AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const update = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const newLevels = [];
        const barCount = 5;
        const binCount = analyserRef.current.frequencyBinCount;
        const binSize = Math.floor(binCount / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += dataArrayRef.current[(i * binSize) + j];
          }
          const average = sum / binSize;
          const normalizedLevel = Math.min((average / 150) * 100, 100);
          newLevels.push(normalizedLevel);
        }

        setLevels([
          newLevels[4],
          newLevels[2],
          newLevels[0],
          newLevels[1],
          newLevels[3]
        ]);
        animationRef.current = requestAnimationFrame(update);
      };

      update()
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  }

  useEffect(() => {
    if (stream) {
      setupAudio();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, [stream])

  return (
    <div className="flex aspect-square w-8 items-center justify-center rounded-full bg-grey-400">
      <div className="flex items-center h-3 gap-0.5">
        {
          levels.map((l, i) => (
            <div
              key={i}
              style={{ height: `${l}%`, transition: "height 0.1s ease-in-out", }}
              className="rounded-full w-0.5 min-h-1 max-h-3 min bg-[#3C3F3E]"
            />
          ))
        }
      </div>
    </div>
  );
}
