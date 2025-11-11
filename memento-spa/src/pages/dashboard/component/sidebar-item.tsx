import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";

interface SideBarItemProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  link?: string;
  active?: boolean;
  onClick?: () => void;
}

export default function SideBarItem({ link = null, active = false, onClick, Icon, title }: SideBarItemProps) {
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
      className={`${active ? "active" : ""} group/item flex h-10 w-full cursor-pointer items-center gap-2 rounded-[8px] bg-transparent px-3 py-2 hover:bg-[#F5EEE3] [.active]:bg-[#F5EEE3]`}
      role="button"
      tabIndex={0}
    >
      <div className="text-gray-500 group-[.active]/item:text-sand-10 group-hover/item:text-sand-10">
        <Icon className="size-5" />
      </div>
      <span className="text-base font-inter font-medium text-gray-700 group-[.active]/item:font-bold group-[.active]/item:text-sand-10 group-hover/item:font-bold group-hover/item:text-sand-10 capitalize">
        {title}
      </span>
    </div>
  );
}
