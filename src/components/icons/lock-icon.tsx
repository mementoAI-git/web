import type { SVGProps } from "react";

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 34 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.66667 17.333V10.6663C8.66667 8.4562 9.54464 6.33659 11.1074 4.77378C12.6702 3.21098 14.7899 2.33301 17 2.33301C19.2101 2.33301 21.3298 3.21098 22.8926 4.77378C24.4554 6.33659 25.3333 8.4562 25.3333 10.6663V17.333M5.33333 17.333H28.6667C30.5076 17.333 32 18.8254 32 20.6663V32.333C32 34.174 30.5076 35.6663 28.6667 35.6663H5.33333C3.49238 35.6663 2 34.174 2 32.333V20.6663C2 18.8254 3.49238 17.333 5.33333 17.333Z"
        stroke="currentColor"
        strokeWidth={3.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

