import React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/utility";

const lineCount = 3;

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
  className?: string;
};

export default function AudioPulse({ active, volume, hover, className }: AudioPulseProps) {
  const lines = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    let timeout: number | null = null;
    const update = () => {
      lines.current.forEach(
        (line, i) =>
        (line.style.height = `${Math.min(
          24,
          4 + volume * (i === 1 ? 400 : 60),
        )}px`),
      );
      timeout = window.setTimeout(update, 100);
    };

    update();

    return () => clearTimeout((timeout as number)!);
  }, [volume]);

  return (
    <div className={cn(
      "flex items-center gap-1 h-6",
      active && "opacity-100",
      !active && "opacity-50",
      className
    )}>
      {Array(lineCount)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            // @ts-expect-error: ref assignment to array element for audio visualization
            ref={(el) => (lines.current[i] = el!)}
            className={cn(
              "w-1 bg-blue-6 rounded-full transition-all duration-100",
              hover && "bg-blue-7"
            )}
            style={{
              animationDelay: `${i * 133}ms`,
              height: "4px"
            }}
          />
        ))}
    </div>
  );
}
