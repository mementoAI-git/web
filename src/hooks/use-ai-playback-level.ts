import { useCallback, useEffect, useRef } from "react";

/** Meter only the AI output graph, never microphone input. */
export function useAiPlaybackLevel(output: GainNode | null) {
  const meter = useRef<{ analyser: AnalyserNode; samples: Float32Array<ArrayBuffer> } | null>(null);
  useEffect(() => {
    if (!output) return;
    const analyser = output.context.createAnalyser();
    analyser.fftSize = 256;
    output.connect(analyser);
    meter.current = { analyser, samples: new Float32Array(analyser.fftSize) };
    return () => {
      meter.current = null;
      output.disconnect(analyser);
      analyser.disconnect();
    };
  }, [output]);
  return useCallback(() => {
    if (!meter.current) return 0;
    const { analyser, samples } = meter.current;
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
    return Math.min(1, rms * 4);
  }, []);
}
