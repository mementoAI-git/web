import Image from "next/image";
import logo from "@/public/image/logo.png"

interface ILogo {
  size?: number
  textClassName?: string
}

export default function Logo({ size = 38, textClassName }: ILogo) {
  return (
    <div className="flex items-center gap-[6px] cursor-pointer">
      <Image width={size} height={size} src={logo} className="object-cover aspect-square" alt="memento logo" />
      <span className={`font-semibold font-geist text-[28.79px] capitalize ${textClassName}`}>memento</span>
    </div>
  )
}