import type { SVGProps } from "react";

export function RemoveBookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.1673 2.5H5.83398C4.43385 2.5 3.73378 2.5 3.199 2.77249C2.7286 3.01217 2.34615 3.39462 2.10646 3.86502C1.83398 4.3998 1.83398 5.09987 1.83398 6.5V17.5L9.00065 13.1667L16.1673 17.5V6.5C16.1673 5.09987 16.1673 4.3998 15.8948 3.86502C15.6552 3.39462 15.2727 3.01217 14.8023 2.77249C14.2675 2.5 13.5675 2.5 12.1673 2.5H14.1673Z"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.5H12.5"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
