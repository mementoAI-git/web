import { cn } from "@/lib/utils";
import type { lifeAreaOptions } from "../flow-options";

export function LifeAreaChip({
  option,
  selected,
  disabled,
  onClick,
}: {
  option: (typeof lifeAreaOptions)[number];
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-full border bg-bg-neutral px-[15px] py-2.5 font-geist text-xs leading-4 text-text-neutral-strong",
    selected ? "border-stroke-brand-strong" : "border-stroke-neutral-weak",
  );
  const content = (
    <>
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center"
      >
        <img src={option.icon} alt="" />
      </span>
      {option.label}
    </>
  );
  return onClick ? (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={{ minWidth: option.width }}
      className={cn(
        className,
        "cursor-pointer transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-brand-strong disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {content}
    </button>
  ) : (
    <span style={{ minWidth: option.width }} className={className}>
      {content}
    </span>
  );
}
