import MicIcon from "@/public/icon/mic.svg";
import EmojiIcon from "@/public/icon/emoji.svg";
import PlusIcon from "@/public/icon/plus.svg";

export default function Chat() {
  return (
    <div className="w-full flex justify-center min-h-screen">
      <div className="mx-auto w-full max-w-220 h-full min-h-screen flex flex-col flex-1">
        <div className="relative flex-1 py-1 overflow-auto flex flex-col justify-end">
          <div>
            <div className="rounded-xl bg-black/4 w-fit px-4 py-2 max-w-81 text-[#475467] font-inter font-normal">
              Welcome back, Groot. It’s good to have you come by today. what’s up? :)
            </div>
            <span></span>
          </div>

          <div className="ml-auto">
            <div className="rounded-xl bg-[#E9ECFC52] w-fit px-4 py-2 max-w-81 text-[#475467] font-inter font-normal">
              Been swell. Was just thinking about how cool it is to have a space where i could recollect my thoughts and ponder on them all by myself for a bit.
            </div>
            <span></span>
          </div>
          <div className="absolute -bottom-15 left-0 right-0 w-full h-10 bg-gradient-to-t from-10% from-black/5 to-transparent" />
        </div>


        <div className="w-full border border-primary rounded-2xl mt-auto p-10 flex flex-col gap-8 min-h-46 mb-4">
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
              <div className="size-12 flex justify-center items-center">
                <MicIcon width={14} height={20} />
              </div>
              <div className="size-12 flex justify-center items-center">
                <EmojiIcon width={20} height={20} />
              </div>
              <button className="btn">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}