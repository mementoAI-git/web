import { cn } from "@/lib/utils";

interface IStatCard {
  icon?: React.ReactElement;
  title: string | number;
  subtitle: string;
  unit?: string;
  variant?: "blue" | "pink" | "orange" | "green" | "purple" | "yellow";
  action?: React.ReactNode;
  bgImage?: string;
}

const valueColors = {
  blue: "text-[#0C71FF]",
  pink: "text-[#D91DAA]",
  orange: "text-[#FF7D0C]",
  green: "text-[#25C971]",
  purple: "text-[#6621F0]",
  yellow: "text-[#FF8C00]",
};

export function StatCard({ title, icon, subtitle, unit = "messages", variant = "blue", action, bgImage }: IStatCard) {
  return (
    <div
      className={cn(
        "flex flex-1 rounded-2xl h-[98px] relative overflow-hidden transition-all hover:scale-[1.02] cursor-default border border-v3-stroke-weak bg-white",
        !bgImage && "p-5 sm:p-6 shadow-sm"
      )}
    >
      {bgImage && (
        <img src={bgImage} alt="" className="absolute inset-0 size-full object-cover" />
      )}

      <div className={cn(
        "flex flex-col justify-center h-full z-10",
        bgImage ? "pl-4" : "gap-1"
      )}>
        <span className={cn(
          "font-inter uppercase font-medium tracking-tight",
          bgImage ? "text-[10px] text-v3-text-weaker" : "text-xs text-v3-text-weak"
        )}>
          {subtitle}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            "font-inter font-bold",
            bgImage ? cn("text-base", valueColors[variant as keyof typeof valueColors]) : "text-sm text-v3-text-strong"
          )}>
            {title}
          </span>
          <span className={cn(
            "font-inter",
            bgImage ? "text-[13px] font-semibold text-v3-text-strong" : "text-xs font-normal text-v3-text-weak"
          )}>
            {unit}
          </span>
        </div>
        {action && (
          <div className="mt-1">
            {action}
          </div>
        )}
      </div>

      {!bgImage && icon && (
        <div className="size-10 sm:size-12 flex items-center justify-center rounded-full bg-white shadow-sm z-10 ml-auto border border-v3-stroke-weak">
          <span className="text-v3-brand-strong scale-110">{icon}</span>
        </div>
      )}

      {!bgImage && (
        <div className="absolute right-0 top-0 size-24 bg-white/50 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none" />
      )}
    </div>
  );
}
