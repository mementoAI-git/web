import Link from "next/link";
import React from "react";

interface ISideBarItem {
  Icon: any;
  title: string;
  link?: string;
  active?: boolean;
  onClick?: () => void;
}

export default function SideBarItem({ link, active = false, onClick, ...props }: ISideBarItem) {
  return (
    <Link
      prefetch={false}
      href={link}
      onClick={onClick}
      className={`${active && "active"} flex items-center group/item gap-2 rounded-[8px] w-full h-10 bg-transparent [.active]:bg-[#F5EEE3] hover:bg-[#F5EEE3] cursor-pointer px-3 py-2`}
    >
      <div className="text-gray-500 group-[.active]/item:text-sand-10 group-hover/item:text-sand-10">
        <props.Icon />
      </div>
      <span className="capitalize group-[.active]/item:text-sand-10 group-hover/item:text-sand-10 text-base font-inter font-medium text-gray-700"> {props.title} </span>
    </Link>
  );
}
