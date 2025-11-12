import type { SVGProps } from "react";

export function LightBulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 17h6M10 21h4M12 17v4m0-4H9m3 0h3m0 4H10m2-4v4m7-11A7 7 0 0 0 5 10c0 2.386 1.195 4.498 3 5.746V17h8v-1.254c1.805-1.248 3-3.36 3-5.746Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

