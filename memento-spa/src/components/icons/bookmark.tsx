import type { SVGProps } from "react";

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1.33594 5.8C1.33594 4.11984 1.33594 3.27976 1.66292 2.63803C1.95054 2.07354 2.40948 1.6146 2.97397 1.32698C3.6157 1 4.45578 1 6.13594 1H10.5359C12.2161 1 13.0562 1 13.6979 1.32698C14.2624 1.6146 14.7213 2.07354 15.009 2.63803C15.3359 3.27976 15.3359 4.11984 15.3359 5.8V19L8.33594 15L1.33594 19V5.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
