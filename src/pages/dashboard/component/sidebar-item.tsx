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
        isActive={active}
        onClick={handleClick}
        className={cn(
          "h-10 gap-3 px-3 py-2 font-inter text-sm font-normal",
          "transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
          active && "font-semibold",
        )}
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          {emoji ? (
            <span className="text-lg leading-none select-none" aria-hidden>
              {emoji}
            </span>
          ) : icon ? (
            <img
              src={icon}
              alt=""
              aria-hidden
              className="size-5 object-contain"
            />
          ) : Icon ? (
            <Icon aria-hidden />
          ) : null}
        </span>
        <span
          className={cn("truncate", active ? "font-semibold" : "font-normal")}
        >
          {title}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
