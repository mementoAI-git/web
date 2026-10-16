import { cn } from "@/lib/utils";

interface IStatCard {
  icon?: React.ReactElement;
  title: string | number;
  subtitle: string;
  unit?: string;
  variant?: "blue" | "pink" | "orange" | "green" | "purple" | "yellow";
  action?: React.ReactNode;
  bgImage?: string;
  compact?: boolean;
}

const valueColors = {
  blue: "text-[#0C71FF]",
  pink: "text-[#D91DAA]",
  orange: "text-[#FF7D0C]",
  green: "text-[#25C971]",
  purple: "text-[#6621F0]",
  yellow: "text-[#FF8C00]",
};

export function StatCard({
  title,
  icon,
  subtitle,
  unit = "messages",
  variant = "blue",
  action,
  bgImage,
  compact = false,
}: IStatCard) {
  return (
    <div
      className={cn(
        "relative flex flex-1 cursor-default overflow-hidden border border-stroke-neutral-weak bg-card",
        compact
          ? "min-h-24 rounded-xl px-5 py-5 xl:min-h-28 xl:px-6 xl:py-6 2xl:min-h-32 2xl:py-7"
          : "h-[98px] rounded-2xl",
        !bgImage && "p-5 sm:p-6 shadow-sm",
      )}
    >
      {bgImage && (
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}

      <div
        className={cn(
          "z-10 flex min-w-0 flex-col justify-center",
          compact ? "w-full gap-3" : "h-full",
          !compact && (bgImage ? "pl-4" : "gap-1"),
        )}
      >
        <span
          className={cn(
            "font-inter uppercase font-medium tracking-tight",
            bgImage
              ? "text-[10px] text-text-neutral-weaker"
              : "text-xs text-text-neutral-weak",
          )}
        >
          {subtitle}
        </span>
        <div className={cn("flex items-baseline gap-1.5", compact && "flex-wrap gap-y-1")}>
          <span
            className={cn(
              "font-inter",
              compact ? "text-lg leading-6 font-semibold tabular-nums xl:text-xl" : "font-bold",
              bgImage
                ? cn(
                    !compact && "text-base",
                    valueColors[variant as keyof typeof valueColors],
                  )
                : cn(!compact && "text-sm", "text-text-neutral-strong"),
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "font-inter",
              bgImage
                ? "text-[13px] font-semibold text-text-neutral-strong"
                : "text-xs font-normal text-text-neutral-weak",
            )}
          >
            {unit}
          </span>
        </div>
        {action && <div className="mt-1">{action}</div>}
      </div>

      {!bgImage && icon && (
        <div className="z-10 ml-auto flex size-10 items-center justify-center rounded-full border border-stroke-neutral-weak bg-bg-neutral shadow-sm sm:size-12">
          <span className="scale-110 text-text-brand-strong">{icon}</span>
        </div>
      )}

      {!bgImage && (
        <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 size-24 rounded-full bg-bg-neutral/50 blur-3xl" />
      )}
    </div>
  );
}
