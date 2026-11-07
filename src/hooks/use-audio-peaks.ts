import { useEffect, useState } from "react";

const PEAKS_PER_SECOND = 50;
const MAX_PEAKS = 12000;

export type AudioPeaks = { peaks: number[]; duration: number };

const cache = new Map<string, Promise<AudioPeaks | null>>();

async function decodePeaks(src: string): Promise<AudioPeaks | null> {
  const Offline =
    typeof OfflineAudioContext === "undefined" ? null : OfflineAudioContext;
  if (!Offline) return null;
  const response = await fetch(src);
  if (!response.ok) return null;
  const audio = await new Offline(1, 1, 44100).decodeAudioData(
    await response.arrayBuffer(),
  );
  const samples = audio.getChannelData(0);
  const count = Math.max(
    1,
    Math.min(MAX_PEAKS, Math.round(audio.duration * PEAKS_PER_SECOND)),
  );
  const size = Math.max(1, Math.floor(samples.length / count));
  const peaks: number[] = [];
  let loudest = 0;
  for (let index = 0; index < count; index += 1) {
    let peak = 0;
    const end = Math.min(samples.length, (index + 1) * size);
    for (let sample = index * size; sample < end; sample += 1) {
      const value = Math.abs(samples[sample]);
      if (value > peak) peak = value;
    }
    peaks.push(peak);
    if (peak > loudest) loudest = peak;
  }
  return {
    duration: audio.duration,
    peaks: loudest ? peaks.map((peak) => peak / loudest) : peaks,
  };
}

/** The real shape of a recording. Null until decoded, or if the browser can't read it. */
export function useAudioPeaks(key: string, src: string): AudioPeaks | null {
  const [result, setResult] = useState<AudioPeaks | null>(null);
  useEffect(() => {
    if (!src) return;
    let active = true;
    let pending = cache.get(key);
    if (!pending) {
      pending = decodePeaks(src).catch(() => null);
      cache.set(key, pending);
    }
    void pending.then((value) => {
      if (active) setResult(value);
    });
    return () => {
      active = false;
    };
  }, [key, src]);
  return result;
}

/**
 * Shrinks peaks to a bar count. Each bar averages its slice: taking the loudest moment
 * instead would make every bar of a longer recording about the same height.
 */
export function resamplePeaks(peaks: number[], count: number): number[] {
  if (peaks.length <= count) return peaks;
  const size = peaks.length / count;
  const bars = Array.from({ length: count }, (_, index) => {
    const start = Math.floor(index * size);
    const end = Math.max(start + 1, Math.floor((index + 1) * size));
    let sum = 0;
    for (let at = start; at < end; at += 1) sum += peaks[at];
    return sum / (end - start);
  });
  const loudest = Math.max(...bars);
  return loudest ? bars.map((bar) => bar / loudest) : bars;
}

/** A stable placeholder shape, so a clip that can't be decoded still reads as audio. */
export function placeholderPeaks(key: string, count: number): number[] {
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.abs(Math.sin((hash % 97) + index * 0.55));
    const detail = Math.abs(Math.sin((hash % 31) + index * 1.7));
    return 0.15 + 0.85 * (0.6 * wave + 0.4 * detail);
  });
}
