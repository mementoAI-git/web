import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";

interface SideBarItemProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
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
  title,
  color = "#F06037",
}: SideBarItemProps) {
  const navigate = useNavigate();
  const { open } = useModal();

  const handleClick = () => {
    if (link) {
      if (link === "/settings") {
        open("settings");
      } else {
        navigate(link);
      }
    }
    onClick?.();
  };

  const activeBg = title.toLowerCase() === "time capsule" ? "#FFF2ED" : "#F5EEE3";
  const activeColor = color || "#D4A373"; // default active color if none provided

  return (
    <div
      onClick={handleClick}
      className={`${active && "active"} flex items-center group/item gap-3 rounded-[8px] w-full h-10 bg-transparent cursor-pointer px-3 py-2 transition-colors`}
      style={{
        backgroundColor: active ? activeBg : undefined,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = activeBg;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        className="size-5 flex items-center justify-center transition-colors"
        style={{ color: active ? activeColor : "#667085" }}
      >
        <Icon className="size-5" />
      </div>
      <span
        className={`text-sm font-inter font-medium transition-colors ${active ? "font-semibold" : "text-[#344054]"}`}
        style={{ color: active ? activeColor : undefined }}
      >
        {title}
      </span>
    </div>
  );
}
