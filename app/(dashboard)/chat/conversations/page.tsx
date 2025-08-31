import Chat from "@/views/Chat/indexV2";
import SearchIcon from "@/public/icon/dashboard/search.svg";
import chatIcon from "@/public/image/chat.png"
import Image from "next/image";
import EllipseIcon from "@/public/icon/vertical-ellipse.svg";

function ConversationItem() {
  return (
    <div className="flex gap-6 p-3 sm:p-6 border border-sand-4 rounded-lg sm:rounded-2xl">
      <div className="flex gap-6">
        <Image alt="Chat icon" className="size-[25px] sm:size-[56px]" src={chatIcon} />
        <span className="font-georgia sm:text-xl text-sand-12">
          Think of a recent happy memory with your family. What happened and why is it meaningful?
        </span>
      </div>
      <EllipseIcon className="size-3 sm:size-4 cursor-pointer" />
    </div>
  )
}

export default function ConversationPage() {
  return (
    <div className="page-viewport">
      <div className="container">
        <div className="py-6 sm:py-12 flex flex-col gap-3 sm:gap-10">
          <h2 className="text-2xl sm:text-[40px] sm:leading-[48px] font-normal font-canela text-sand-12">
            Recent conversations
          </h2>
          <div className="bg-white flex items-center gap-2 border border-gray-200 rounded-lg p-3.5">
            <SearchIcon />
            <input placeholder="Search..." className="outline-none w-full flex-1" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col shrink-0">
            <span className="font-bold text-sm font-inter text-gray-800">TODAY</span>
            <span className="text-gray-500 text-sm font-inter font-normal">18/08/25</span>
          </div>
          <div className="flex flex-col gap-4">
            <ConversationItem />
            <ConversationItem />
            <ConversationItem />
          </div>
        </div>
      </div>
    </div>
  )
}
