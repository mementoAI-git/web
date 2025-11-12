import type { SVGProps } from "react";

export function VerticalEllipseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 4 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.003 6.667a.667.667 0 1 0 0-1.334.667.667 0 0 0 0 1.334Zm0-4.667a.667.667 0 1 0 0-1.334.667.667 0 0 0 0 1.334Zm0 9.333a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333Z"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

