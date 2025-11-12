import type { SVGProps } from "react";

export function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M.75 4.5C.75 2.705 2.205 1.25 4 1.25h16.323c.086 0 .203.048.288.134L31.116 12.177c.086.086.134.202.134.323V36.5c0 1.795-1.455 3.25-3.25 3.25H4c-1.795 0-3.25-1.455-3.25-3.25V4.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M20 1v7.5c0 2.21 1.791 4 4 4h7.5"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

