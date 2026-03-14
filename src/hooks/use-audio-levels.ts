"use client";

import { useEffect, useState } from "react";

const BAR_COUNT = 24;
const MIN_HEIGHT = 8;
const MAX_HEIGHT = 48;
const SMOOTHING = 0.4;
const FFT_SIZE = 256;

/**
 * Returns an array of 24 bar heights (px) driven by live microphone input.
 * When stream is null or enabled is false, returns zeros.
 */
export function useAudioLevels(stream: MediaStream | null, enabled: boolean): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(MIN_HEIGHT));

  useEffect(() => {
    if (!stream || !enabled) {
      setLevels(Array(BAR_COUNT).fill(MIN_HEIGHT));
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bucketSize = Math.floor(analyser.frequencyBinCount / BAR_COUNT);

    let rafId: number;

    const update = () => {
      analyser.getByteFrequencyData(dataArray);

      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const start = i * bucketSize;
        let sum = 0;
        for (let j = 0; j < bucketSize && start + j < dataArray.length; j++) {
          sum += dataArray[start + j];
        }
        const avg = sum / bucketSize;
        const normalized = Math.min(1, avg / 255);
        return MIN_HEIGHT + normalized * (MAX_HEIGHT - MIN_HEIGHT);
      });

      setLevels(next);
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      audioContext.close();
      setLevels(Array(BAR_COUNT).fill(MIN_HEIGHT));
    };
  }, [stream, enabled]);

  return levels;
}
