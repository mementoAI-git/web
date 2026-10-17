import { useTextReveal } from "./use-text-reveal";
import { useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import "./text-reveal.css";

export function MotionHeading({
  className,
  ...props
}: ComponentProps<"header">) {
  const ref = useRef<HTMLElement>(null);
  useTextReveal(ref);
  return <header ref={ref} className={cn("t-stagger", className)} {...props} />;
}
