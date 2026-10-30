/** Conservative client endpointing; Gemini still detects speech on the server. */
export function createSpeechEndDetector(sampleRate: number) {
  let noiseFloor: number | undefined;
  let speechMs = 0;
  let quietMs = 0;

  return {
    reset() {
      noiseFloor = undefined;
      speechMs = 0;
      quietMs = 0;
    },
    push(samples: Float32Array): boolean {
      if (!samples.length) return false;
      let energy = 0;
      for (const sample of samples) energy += sample * sample;
      const rms = Math.sqrt(energy / samples.length);
      const durationMs = samples.length / sampleRate * 1000;
      noiseFloor ??= Math.min(rms, 0.02);
      const threshold = Math.max(0.008, noiseFloor * 3);

      if (rms > threshold) {
        speechMs += durationMs;
        quietMs = 0;
        return false;
      }
      if (speechMs === 0) {
        noiseFloor = noiseFloor * 0.9 + rms * 0.1;
        return false;
      }
      quietMs += durationMs;
      // Longer than server VAD's 800 ms, so normal conversational pauses survive.
      if (quietMs < 1200) return false;
      const spoken = speechMs >= 80;
      speechMs = 0;
      quietMs = 0;
      noiseFloor = rms;
      return spoken;
    },
  };
}
