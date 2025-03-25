import Image from "next/image";
import logo from "@/public/image/logo.png"

export default function Logo() {
  return (
    <div className="flex items-center gap-[6px] cursor-pointer">
      <Image width={38} height={38} src={logo} className="object-cover aspect-square w-[38px]" alt="memento logo" />
      <span className="font-semibold font-geist text-[28.79px] capitalize">memento</span>
    </div>
  )
}