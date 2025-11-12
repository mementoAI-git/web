import type { SVGProps } from "react";

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1 8s2.005-2.732 3.634-4.362C6.263 2.008 8.514 1 11 1c4.971 0 9 4.03 9 9s-4.029 9-9 9c-4.103 0-7.565-2.746-8.648-6.5M1 8V2m0 6h6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

