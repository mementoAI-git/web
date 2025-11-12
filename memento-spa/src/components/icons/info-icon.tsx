import type { SVGProps } from "react";

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 13.446V10.113m0-3.333h.008m8.325 3.333c0 4.602-3.731 8.333-8.333 8.333-4.603 0-8.334-3.731-8.334-8.333 0-4.603 3.731-8.334 8.334-8.334 4.602 0 8.333 3.731 8.333 8.334Z"
        stroke="currentColor"
        strokeWidth={1.5873}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

