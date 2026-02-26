import type { SVGProps } from "react";

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            <path d="M5 3l.8 2.4a1 1 0 00.6.6L8.8 6.8 6.4 7.6a1 1 0 00-.6.6L5 10.6l-.8-2.4a1 1 0 00-.6-.6L1.2 6.8l2.4-.8a1 1 0 00.6-.6L5 3z" />
            <path d="M19 16l.6 1.8a1 1 0 00.6.6l1.8.6-1.8.6a1 1 0 00-.6.6l-.6 1.8-.6-1.8a1 1 0 00-.6-.6l-1.8-.6 1.8-.6a1 1 0 00.6-.6l.6-1.8z" />
        </svg>
    );
}
