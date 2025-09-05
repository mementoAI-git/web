import Image from "next/image";
import EllipseIcon from "@/public/icon/vertical-ellipse.svg";
import chatIcon from "@/public/image/chat.png"
import { cn } from "@/utility";
import Link from "next/link";

export default function TopicBar({ title, _id, size = "sm" }) {
  const isLarge = size === "lg"
  return (
    <Link href={`/chat/${_id}`} className={cn(
      "w-full rounded-xl border-sand-4 border flex items-center justify-between px-3 py-2", {
      "p-3 sm:p-6": isLarge
    })}>
      <div className="flex items-center gap-4">
        <Image
          alt="Chat icon"
          className={cn("size-[35px]", { "size-[25px] sm:size-[56px]": isLarge })}
          src={chatIcon}
        />
        <span className={cn("font-georgia text-sand-12", { "sm:text-xl text-sand-12": isLarge })}>
          {title}
        </span>
      </div>
      <EllipseIcon className={cn("size-4 cursor-pointer", { "size-3 sm:size-4": isLarge })} />
    </Link>
  )
}

export function TopicBarSkeleton({ size = "sm" }) {
  const isLarge = size === "lg"
  return (
    <div className={cn("w-full rounded-2xl border-sand-4 border flex items-center justify-between px-3 py-2 animate-pulse", {
      "p-3 sm:p-6": isLarge
    })}>
      <div className="flex flex-1 items-center gap-4">
        <div className={cn("size-10 bg-sand-3 rounded", { "size-20 sm:size-30": isLarge })} />
        <div className={cn("h-4 w-full max-w-50 bg-sand-3 rounded", { "max-w-60": isLarge })} />
      </div>
      <div className="size-4 shrink-0 bg-sand-3 rounded" />
    </div>
  )
}