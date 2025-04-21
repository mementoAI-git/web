import Link from "next/link";

interface ISideBarItem {
  Icon: any;
  title: string;
  link: string;
}

export default function SideBarItem({ Icon, link, title }: ISideBarItem) {
  return (
    <Link prefetch={false} href={link} className="flex items-center group gap-2 rounded-[6px] w-full max-h-10 bg-transparent hover:bg-grey-400 cursor-pointer text-[#344054] hover:text-[#050709] font-semibold font-inter px-3 py-2" >
      <div className="text-[#667085] group-hover:text-primary">
        <Icon />
      </div>
      <span className="capitalize group-hover:text-primary"> {title} </span>
    </Link>
  );
}
