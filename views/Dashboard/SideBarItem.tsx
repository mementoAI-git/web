import Link from "next/link";
import React from "react";

interface ISideBarItem {
  Icon: any;
  title: string;
  link?: string;
  active?: boolean
}

export default function SideBarItem({ link, active = false, ...props }: ISideBarItem) {
  return (
    <Link prefetch={false} href={link} className={`${active && "active"} flex items-center group-[.close]:justify-center group/item gap-2 rounded-[6px] w-full group-[.close]:w-11 h-10 bg-transparent [.active]:bg-grey-400 hover:bg-grey-400 cursor-pointer text-[#344054] [.active]:text-primary hover:text-primary font-semibold font-inter px-3 py-2`}>
      <div className="text-[#667085] group-hover/item:text-primary group-[.active]/item:text-primary">
        <props.Icon />
      </div>
      <span className="capitalize group-[.close]:hidden"> {props.title} </span>
    </Link>
  );
}
