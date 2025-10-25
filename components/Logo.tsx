import Image from "next/image";
import logo from "@/public/image/logo.png";
import lightlogo from "@/public/image/logo-light.png";
import { cn } from "@/utility";

interface ILogo {
  size?: number;
  color?: "light" | "dark"
  textClassName?: string;
}

export function LogoV2({ className = "" }) {
  return (
    <span
      className={cn("font-garamond font-medium capitalize text-[28.82px] sm:text-[32px] leading-[38px] text-gray-950", className)}
    >
      memento.
    </span>
  )
}

export default function Logo({ size = 38, color = "dark", textClassName = "" }: ILogo) {
  return (
    <div className="flex cursor-pointer items-center gap-[6px]">
      <Image
        width={size}
        height={size}
        src={color === "light" ? lightlogo : logo}
        className="aspect-square shrink-0 object-cover"
        alt="memento logo"
      />
      <span
        className={cn("font-geist text-[28.79px] font-semibold capitalize", textClassName, { "text-white": color === "light" })}
      >
        memento
      </span>
    </div>
  );
}
