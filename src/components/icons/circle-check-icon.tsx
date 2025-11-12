import type { SVGProps } from "react";

export function CircleCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.99967 18.3332C14.6021 18.3332 18.333 14.6022 18.333 9.99984C18.333 5.39746 14.6021 1.6665 9.99967 1.6665C5.39729 1.6665 1.66634 5.39746 1.66634 9.99984C1.66634 14.6022 5.39729 18.3332 9.99967 18.3332Z"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66699 10L8.83366 12.1667L13.3337 7.66667"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
