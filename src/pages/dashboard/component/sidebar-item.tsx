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
  color: _color = "#F06037",
}: SideBarItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[8px] border px-3 py-2 transition-colors group/item",
        active
          ? "active border-border bg-accent"
          : "border-transparent bg-transparent hover:bg-accent",
      )}
    >
      <div className="size-5 flex items-center justify-center transition-colors">
        {emoji ? (
          <span className="text-lg leading-none select-none" aria-hidden>
            {emoji}
          </span>
        ) : icon ? (
          <img src={icon} alt={title} className="size-5 object-contain" />
        ) : Icon ? (
          <Icon
            className={cn(
              "size-5",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          />
        ) : null}
      </div>
      <span
        className={cn(
          "text-sm font-inter font-medium transition-colors",
          active ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {title}
      </span>
    </div>
  );
}
