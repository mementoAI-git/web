import { useEffect, useRef, useState } from "react";

interface MovingBarsWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  width?: number; // Optional, will be ignored for responsive
  height?: number;
  barCount?: number;
  color?: string;
}

export default function MovingBarsWaveform({
  stream,
  isRecording,
  height = 48,
  barCount = 120,
  color = "black"
}: MovingBarsWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(320);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const barsBufferRef = useRef<number[]>(Array(barCount).fill(2));
  const lastBarRef = useRef<number>(2);
  const lastUpdateRef = useRef<number>(Date.now());
  const updateInterval = 40; // ms, about 25 bars per second

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    const resizeObserver = new window.ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!stream || !isRecording) return;
    audioContextRef.current = new window.AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = 0.85;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, height);

    function draw() {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      // Calculate the current amplitude (volume)
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = (dataArrayRef.current[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);
      // Smoothing: blend with previous value for fluidity
      const prev = lastBarRef.current;
      const barHeight = Math.max(prev * 0.6 + rms * height * 2.2 * 0.4, 2); // blend prev and new
      lastBarRef.current = barHeight;

      // Only update buffer at fixed interval
      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        barsBufferRef.current.push(barHeight);
        if (barsBufferRef.current.length > barCount) {
          barsBufferRef.current.shift();
        }
        lastUpdateRef.current = now;
      }

      // Draw bars
      ctx.clearRect(0, 0, canvasWidth, height);
      // Optional: gradient for modern look
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "AA"); // subtle fade
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvasWidth, height);
      const barWidth = 1.5;
      const gap = 1;
      for (let i = 0; i < barCount; i++) {
        const h = barsBufferRef.current[i];
        ctx.fillStyle = grad;
        // Center bars vertically
        const y = (height - h) / 2;
        ctx.fillRect(i * (barWidth + gap), y, barWidth, h);
      }
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      barsBufferRef.current = Array(barCount).fill(2);
      lastBarRef.current = 2;
      lastUpdateRef.current = Date.now();
    };
  }, [stream, isRecording, canvasWidth, height, color, barCount]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={height}
        style={{ display: "block", width: "100%", height }}
      />
    </div>
  );
} 