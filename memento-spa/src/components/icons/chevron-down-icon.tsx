import type { SVGProps } from "react";

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeOpacity={0.45}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
