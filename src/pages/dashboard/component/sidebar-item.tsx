import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utility";

interface SideBarItemProps {
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  icon?: string;
  /** Shown in the icon column instead of Icon / image URL */
  emoji?: string;
  title: string;
  link?: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}

export default function SideBarItem({
  link = null,
  active = false,
  onClick,
  Icon,
  icon,
  emoji,
  title,
  color = "#F06037",
}: SideBarItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
    onClick?.();
  };

  const activeBg = "var(--v3-fill-weak)";
  const activeBorder = "#FCFCFC";
  const activeTextColor = "#1E1E1E";

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[8px] bg-transparent px-3 py-2 transition-colors group/item",
        active && "active",
      )}
      style={{
        backgroundColor: active ? activeBg : undefined,
        border: active ? `1px solid ${activeBorder}` : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = activeBg;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div className="size-5 flex items-center justify-center transition-colors">
        {emoji ? (
          <span className="text-lg leading-none select-none" aria-hidden>
            {emoji}
          </span>
        ) : icon ? (
          <img src={icon} alt={title} className="size-5 object-contain" />
        ) : Icon ? (
          <Icon className="size-5" style={{ color: active ? activeTextColor : "#667085" }} />
        ) : null}
      </div>
      <span
        className={`text-sm font-inter font-medium transition-colors ${active ? "font-semibold" : "text-[#344054]"}`}
        style={{ color: active ? activeTextColor : undefined }}
      >
        {title}
      </span>
    </div>
  );
}
