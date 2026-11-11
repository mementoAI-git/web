import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatRecordingClock } from "./recording-clock";

/** Designer waveform for recording cards: bar heights in px, centred on one line. */
const RECORDING_WAVEFORM = [12.99, 12.99, 20.41, 24.12, 20.41, 31.54, 20.41, 12.99, 24.12, 20.41, 8.04];
const BAR_WIDTH = 2.17;
const BAR_PITCH = 5.79;
const WAVE_HEIGHT = 32;
const WAVE_WIDTH = BAR_PITCH * (RECORDING_WAVEFORM.length - 1) + BAR_WIDTH;

/** Recording story card, matching mobile: weak fill, two faint rings, brand waveform, time in a chip. */
export function RecordingCard({ duration, className, children }: {
  duration?: number;
  className?: string;
  /** Overlays such as the processing badge and media counter. */
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[174.5/237] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-stroke-neutral-weaker bg-v3-fill-weak transition-[filter] duration-150 motion-reduce:transition-none group-hover/card:brightness-[0.97]",
        className,
      )}
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full text-v3-stroke-weak"
        viewBox="0 0 174.5 237"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <circle cx="229.787" cy="250.518" r="134.787" stroke="currentColor" />
        <circle cx="30.084" cy="142.631" r="153.869" stroke="currentColor" />
      </svg>
      {children}
      <svg
        aria-hidden
        className="relative text-v3-brand-strong"
        width={WAVE_WIDTH}
        height={WAVE_HEIGHT}
        viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`}
      >
        {RECORDING_WAVEFORM.map((height, index) => (
          <rect
            key={index}
            x={index * BAR_PITCH}
            y={(WAVE_HEIGHT - height) / 2}
            width={BAR_WIDTH}
            height={height}
            rx={BAR_WIDTH / 2}
            fill="currentColor"
          />
        ))}
      </svg>
      <span className="relative flex h-[22px] min-w-[58px] items-center justify-center rounded-full bg-v3-stroke-weak px-2 font-inter text-[11px] font-medium leading-4 tabular-nums text-v3-text-strong">
        {formatRecordingClock(duration)}
      </span>
    </div>
  );
}
