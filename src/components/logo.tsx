import { cn } from "@/utility";

export default function Logo({ className = "" }) {
  return (
    <span
      className={cn("font-garamond font-medium capitalize text-[28.82px] sm:text-[32px] leading-[38px] text-gray-950", className)}
    >
      memento.
    </span>
  )
}
