import MicIcon from "@/public/icon/mic.svg";
import EmojiIcon from "@/public/icon/emoji.svg";
import PlusIcon from "@/public/icon/plus.svg";

export default function ChatInput() {
  return (
    <div className="pt-5 absolute bottom-0 right-0 left-0 z-30">
      <div className="absolute bg-white blur-2xl top-0 left-0 right-0 w-full h-10 z-40" />
      <div className=" w-full border border-primary rounded-2xl mt-auto p-10 flex flex-col gap-8 min-h-46 bg-white z-50">
        <textarea
          className="h-fit outline-none resize-none placeholder:text-grey-800 font-inter font-normal"
          placeholder="What’s on your mind today? Click here to start typing, or click on the record button to say something. "
        ></textarea>
        <div className="items-center justify-between flex">
          <div
            className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#EAECF0]"
          >
            <PlusIcon width={20} height={20} />
          </div>

          <div className="text-[#344054] flex gap-3 items-center">
            <div className="size-12 flex justify-center cursor-pointer items-center">
              <MicIcon width={14} height={20} />
            </div>
            <div className="size-12 flex justify-center cursor-pointer  items-center">
              <EmojiIcon width={20} height={20} />
            </div>
            <button className="btn">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
