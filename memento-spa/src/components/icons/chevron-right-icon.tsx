import type { SVGProps } from "react";

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.5 11L6.5 6L1.5 1"
        stroke="currentColor"
        strokeOpacity={0.45}
        strokeWidth={1.875}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

