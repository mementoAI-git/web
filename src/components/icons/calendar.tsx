import type { SVGProps } from "react";

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.1667 1.33301V3.99967M5.83333 1.33301V3.99967M2.5 6.66634H14.5M3.83333 2.66634H13.1667C13.903 2.66634 14.5 3.26329 14.5 3.99967V13.333C14.5 14.0694 13.903 14.6663 13.1667 14.6663H3.83333C3.09695 14.6663 2.5 14.0694 2.5 13.333V3.99967C2.5 3.26329 3.09695 2.66634 3.83333 2.66634Z"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
