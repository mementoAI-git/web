import { Button } from "@heroui/react";
import { ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import upgradeCardBg from "@/assets/image/upgradecard.png";
import diamondCrystal from "@/assets/icon/diamond crystal.png";

type SidebarUpgradeCardProps = {
  /** Called after navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
};

export function SidebarUpgradeCard({ onNavigate }: SidebarUpgradeCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[24px] bg-cover bg-center p-[12px] text-white shadow-[0_4px_16px_rgba(23,11,0,0.12)]"
      style={{ backgroundImage: `url(${upgradeCardBg})` }}
    >
      <div className="flex flex-col items-start gap-1">
        <img
          src={diamondCrystal}
          alt=""
          className="size-[40px] shrink-0 object-contain"
          width={40}
          height={40}
        />
        <h3 className="font-garamond text-[20px] font-semibold leading-tight text-white">
          Unlock more with Pro
        </h3>
      </div>
      <p className="mt-2 font-inter text-[11px] leading-[15px] text-white/95">
        Advanced features, more storage and better memory contextualization with
        Pro.
      </p>
      <Button
        type="button"
        variant="ghost"
        className="mt-4 h-10 min-w-0 rounded-full !border-0 !bg-white/20 !px-4 font-inter text-sm font-medium !text-white hover:!bg-white/30 data-[hovered]:!bg-white/30 data-[pressed]:!bg-white/25"
        onPress={() => {
          navigate("/settings/general");
          onNavigate?.();
        }}
      >
        <span className="flex items-center gap-2">
          <ArrowUpCircle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          Upgrade
        </span>
      </Button>
    </div>
  );
}
