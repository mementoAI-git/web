import { useNavigate } from "react-router-dom";
import { cn } from "@/utility";
import starBadge from "@/assets/image/star-badge.png";

type SidebarUpgradeCardProps = {
  /** Called after navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
};

const upgradeCardBackground =
  "linear-gradient(234.11deg, rgba(99, 255, 125, 0.1) 11.28%, rgba(255, 255, 255, 0) 81.83%), #FFFFFF";

export function SidebarUpgradeCard({ onNavigate }: SidebarUpgradeCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="relative box-border flex min-h-[131px] w-full min-w-0 shrink-0 flex-col items-start rounded-[12px] p-2"
      style={{ background: upgradeCardBackground }}
    >
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
            <h3 className="min-w-0 flex-1 font-garamond text-[14px] font-normal leading-[18px] text-[#1E1E1E]">
              Unlock more with Pro
            </h3>
          </div>
          <p className="line-clamp-3 font-inter text-[12px] font-normal leading-[18px] text-[rgba(30,30,30,0.65)]">
            Advanced features, more storage, voice chat, and better memory context
            with Pro.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "flex h-fit w-full shrink-0 flex-row items-center justify-center gap-1 rounded-full",
            "bg-[#FF5E00] px-2.5 py-2 font-inter text-xs font-semibold leading-[18px] text-white",
            "shadow-[inset_0_-3px_12px_rgba(0,0,0,0.29)]",
            "outline-none transition-opacity hover:opacity-95",
            "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
          )}
          onClick={() => {
            navigate("/pricing");
            onNavigate?.();
          }}
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
