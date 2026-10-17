import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utility";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface SideBarItemProps {
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  icon?: string;
  /** Shown in the icon column instead of Icon / image URL */
  emoji?: string;
  title: string;
  tone?: "neutral" | "brand";
  link?: string;
  active?: boolean;
  onClick?: () => void;
}

export default function SideBarItem({
  link = null,
  active = false,
  onClick,
  Icon,
  icon,
  emoji,
  title,
  tone = "neutral",
}: SideBarItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
    onClick?.();
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        aria-label={title}
        title={title}
        isActive={active}
        onClick={handleClick}
        className={cn(
          "[&_svg]:size-6 h-11 gap-3 px-3 py-2.5 font-inter text-sm font-normal",
          "navigation-button",
          active && "font-semibold",
          tone === "brand" && "text-text-brand-strong",
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center">
          {emoji ? (
            <span
              className="text-[23.896px] leading-none select-none"
              aria-hidden
            >
              {emoji}
            </span>
          ) : icon ? (
            <img
              src={icon}
              alt=""
              aria-hidden
              className="shrink-0 object-contain"
            />
          ) : Icon ? (
            <Icon
              className={cn(
                "size-6",
                tone === "brand"
                  ? "text-icon-brand-strong"
                  : "text-icon-neutral-strong",
              )}
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
        </span>
        <span
          data-sidebar-label=""
          className={cn("truncate", active ? "font-semibold" : "font-normal")}
        >
          {title}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
