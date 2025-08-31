import Image from "next/image";
import EllipseIcon from "@/public/icon/vertical-ellipse.svg";
import chatIcon from "@/public/image/chat.png"

export default function RecentConversationItem() {
  return (
    <div className="w-full rounded-2xl border-sand-4 border flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-4">
        <Image alt="Chat icon" className="size-[35px]" src={chatIcon} />
        <span className="font-georgia text-sand-12">
          Think of a recent happy memory with your family. What happened and why is it meaningful?
        </span>
      </div>
      <EllipseIcon className="size-4 cursor-pointer" />
    </div>
  )
}