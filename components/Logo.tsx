import Image from "next/image";
import logo from "@/public/image/logo.png";

interface ILogo {
  size?: number;
  textClassName?: string;
}

export default function Logo({ size = 38, textClassName }: ILogo) {
  return (
    <div className="flex cursor-pointer items-center gap-[6px]">
      <Image
        width={size}
        height={size}
        src={logo}
        className="aspect-square object-cover"
        alt="memento logo"
      />
      <span
        className={`font-geist text-[28.79px] font-semibold capitalize ${textClassName}`}
      >
        memento
      </span>
    </div>
  );
}
