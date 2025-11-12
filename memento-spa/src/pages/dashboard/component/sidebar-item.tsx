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
      className={`${active && "active"} flex items-center group/item gap-2 rounded-[8px] w-full h-10 bg-transparent [.active]:bg-[#F5EEE3] hover:bg-[#F5EEE3] cursor-pointer px-3 py-2`}
    >
      <div className="text-gray-500 group-[.active]/item:text-sand-10 group-hover/item:text-sand-10">
        <Icon className="size-5" />
      </div>
      <span className="capitalize group-[.active]/item:text-sand-10 group-hover/item:text-sand-10 group-[.active]/item:font-bold group-hover/item:font-bold text-base font-inter font-medium text-gray-700"> {title} </span>
    </div>
  );
}
