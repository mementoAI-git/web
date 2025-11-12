import type { SVGProps } from "react";

export function LaunchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.333 9.766 9.666 1.432M9.666 1.432H1.333m8.333 0V9.766"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
