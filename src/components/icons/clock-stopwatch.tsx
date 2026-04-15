import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function ClockStopwatch({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-v3-brand-strong", className)}
    >
      <path
        d="M7.99992 6.3335V9.00016L9.66659 10.0002M7.99992 3.3335C4.87031 3.3335 2.33325 5.87055 2.33325 9.00016C2.33325 12.1298 4.87031 14.6668 7.99992 14.6668C11.1295 14.6668 13.6666 12.1298 13.6666 9.00016C13.6666 5.87055 11.1295 3.3335 7.99992 3.3335ZM7.99992 3.3335V1.3335M6.66659 1.3335H9.33325M13.5526 3.72819L12.5526 2.72819L13.0526 3.22819M2.44727 3.72819L3.44727 2.72819L2.94727 3.22819"
        stroke="currentColor"
        strokeOpacity="0.8"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
