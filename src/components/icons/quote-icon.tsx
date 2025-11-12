import type { SVGProps } from "react";

export function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1 10H4L6 6V0H0V6H3L1 10ZM9 10H12L14 6V0H8V6H11L9 10Z"
        fill="currentColor"
      />
    </svg>
  );
}
