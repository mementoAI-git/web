import type { SVGProps } from "react";

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 15 19 10m0 0-5-5m5 5H7M7 1H5.8c-1.68 0-2.52 0-3.162.327a2.5 2.5 0 0 0-1.311 1.31C1 3.28 1 4.12 1 5.8v8.4c0 1.68 0 2.52.327 3.162a2.5 2.5 0 0 0 1.311 1.311C3.28 19 4.12 19 5.8 19H7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

