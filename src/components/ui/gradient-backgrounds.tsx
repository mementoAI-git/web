import { cn } from "@/lib/utils";

type GradientBackgroundProps = {
  className?: string;
};

export function AmberGlowBackground({ className }: GradientBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 z-0 pointer-events-none", className)}
      style={{
        backgroundImage:
          "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)",
        backgroundSize: "100% 100%",
      }}
    />
  );
}
