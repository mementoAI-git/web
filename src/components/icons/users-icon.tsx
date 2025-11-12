import type { SVGProps } from "react";

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 19 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.03 14.05 14.697 15.717 18.03 12.384M9.697 11.551H6.363c-1.553 0-2.329 0-2.942.254-.817.338-1.466.987-1.804 1.804-.254.613-.254 1.39-.254 2.943m11.25-14.758c1.222.495 2.083 1.693 2.083 3.092 0 1.399-.861 2.597-2.083 3.092m-1.667-3.092a3.333 3.333 0 1 1-6.667 0 3.333 3.333 0 0 1 6.667 0Z"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

