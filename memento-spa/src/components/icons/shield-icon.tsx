import type { SVGProps } from "react";

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 15 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.332 5.361 5.832 7.86l3.333 1.667-2.5 2.5m7.5-2.916c0 4.09-4.462 7.065-6.085 8.012-.184.108-.276.162-.406.19-.101.022-.248.022-.349 0-.13-.028-.222-.082-.406-.19C5.294 16.176.832 13.201.832 9.111V5.125c0-.666 0-1 .109-1.286.096-.253.252-.478.456-.657.229-.203.541-.32 1.164-.554l4.468-1.675c.174-.065.26-.097.349-.11a.783.783 0 0 1 .238 0c.089.012.176.045.349.11l4.468 1.675c.624.234.936.351 1.166.554.203.179.36.404.456.657.109.286.109.619.109 1.286v3.986Z"
        stroke="currentColor"
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

