import Link from "next/link"

interface ISideBarItem {
  Icon: any
  title: string
  link: string
}

export default function SideBarItem({ Icon, link, title }: ISideBarItem) {
  return (
    <Link href={link} className="flex items-center gap-2 rounded-[6px] w-full max-h-10 bg-transparent hover:bg-grey-400 cursor-pointer text-[#344054] hover:text-[#3C3F3E] font-semibold font-inter px-3 py-2" >
      <Icon />
      < span className="capitalize" > {title} </span>
    </Link>
  )
}