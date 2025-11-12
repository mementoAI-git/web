import type { SVGProps } from "react";

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.5 11L1.5 6L6.5 1"
        stroke="currentColor"
        strokeWidth={1.67}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

