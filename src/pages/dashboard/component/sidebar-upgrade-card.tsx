import { useState } from "react";
import { cn } from "@/utility";
import starBadge from "@/assets/image/star-badge.png";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";

type SidebarUpgradeCardProps = {
  /** Called after navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
};

export function SidebarUpgradeCard({ onNavigate }: SidebarUpgradeCardProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <div className="relative box-border flex min-h-[131px] w-full min-w-0 shrink-0 flex-col items-start rounded-[12px] bg-fill-neutral-weaker p-2">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-col gap-1 self-stretch">
            <div className="flex flex-row items-center gap-1 self-stretch">
              <span className="box-border flex h-[32px] w-[32px] shrink-0 flex-none items-center justify-center overflow-hidden">
                <img
                  src={starBadge}
                  alt=""
                  width={32}
                  height={32}
                  className="block h-[32px] w-[32px] max-h-[32px] max-w-[32px] object-contain"
                  decoding="async"
                  draggable={false}
                />
              </span>
              <h3 className="min-w-0 flex-1 font-garamond text-[14px] font-normal leading-[18px] text-text-neutral-strong">
                Unlock more with Pro
              </h3>
            </div>
            <p className="line-clamp-3 font-inter text-[12px] font-normal leading-[18px] text-text-neutral-weak">
              Advanced features, more storage, voice chat, and better memory
              context with Pro.
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "flex h-fit w-full shrink-0 flex-row items-center justify-center gap-1 rounded-full",
              "bg-fill-brand-strong px-2.5 py-2 font-inter text-xs font-semibold leading-[18px] text-text-inverse-strong",
              "outline-none transition-opacity hover:opacity-95",
              "focus-visible:ring-2 focus-visible:ring-stroke-brand-strong focus-visible:ring-offset-2",
            )}
            onClick={() => {
              setUpgradeOpen(true);
              onNavigate?.();
            }}
          >
            Upgrade
          </button>
        </div>
      </div>
      <UpgradePrompt
        feature="pro_plan"
        variant="modal"
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
      />
    </>
  );
}
