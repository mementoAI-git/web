import type { SVGProps } from "react";

export function WaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="100%" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1 7.33333L1 10.6667M4.75 8.16667V9.83333M8.5 4V14M12.25 1.5V16.5M16 7.33333V10.6667"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

