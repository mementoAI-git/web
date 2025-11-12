import type { SVGProps } from "react";

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7 12.334h6M1 12.334h1.116c.326 0 .489 0 .643-.037.136-.033.266-.086.385-.159.135-.082.25-.198.48-.428L12 3.334c.553-.553.553-1.448 0-2-.552-.552-1.448-.552-2 0L1.625 9.709c-.23.23-.345.345-.427.48a1.04 1.04 0 0 0-.16.385c-.033.153-.033.317-.033.643v1.116Z"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

