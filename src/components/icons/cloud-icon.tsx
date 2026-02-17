import type { SVGProps } from "react";

export function CloudIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="100%"
            height="auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-4-4.5a7 7 0 1 0-13.7 1.8 4.5 4.5 0 0 0 .2 8.7" />
        </svg>
    );
}
