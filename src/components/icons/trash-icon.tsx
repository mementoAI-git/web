import type { SVGProps } from "react";

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.667 3.5v-.533c0-.747 0-1.12-.146-1.405a1.167 1.167 0 0 0-.582-.583C8.654.834 8.28.834 7.533.834H6.467c-.747 0-1.12 0-1.405.146-.25.128-.454.332-.582.583-.145.285-.145.658-.145 1.405V3.5m1.333 3.667v3.333m2.667-3.333v3.333M1 3.5h12m-1.333 0v7.467c0 1.12 0 1.68-.218 2.108a1.667 1.667 0 0 1-.874.874c-.428.218-.988.218-2.108.218H5.533c-1.12 0-1.68 0-2.108-.218a1.667 1.667 0 0 1-.874-.874C2.333 12.18 2.333 11.62 2.333 10.5V3.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

