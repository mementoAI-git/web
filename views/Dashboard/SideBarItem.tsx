import Link from "next/link";

interface ISideBarItem {
  Icon: any;
  title: string;
  link: string;
}

export default function SideBarItem({ Icon, link, title }: ISideBarItem) {
  return (
    <Link
      href={link}
      className="group flex max-h-10 w-full cursor-pointer items-center gap-2 rounded-[6px] bg-transparent px-3 py-2 font-inter font-semibold text-[#344054] hover:bg-grey-400 hover:text-primary"
    >
      <div className="text-[#667085] group-hover:text-primary">
        <Icon />
      </div>
      <span className="capitalize group-hover:text-primary"> {title} </span>
    </Link>
  );
}
