import type { SVGProps } from "react";

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M1 5H13M1 1H13M1 9H13" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}