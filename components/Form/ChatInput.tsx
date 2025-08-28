import GearIcon from "@/public/icon/gear.svg";
import PlusIcon from "@/public/icon/plus.svg";
import WaveIcon from "@/public/icon/wave.svg";
import { cn } from "@/utility";

export default function Chatinput() {
  return (
    <div className="w-full h-fit flex flex-col max-w-[760px] gap-3 md:gap-10 rounded-2xl border border-sand-4 py-3 px-4 md:p-6 bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C]">
      <textarea
        placeholder="Type text here..."
        className="min-h-10 md:min-h-25 w-full outline-none resize-none text-lg md:text-2xl"
      >

      </textarea>
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          <div className="icon-container !size-8 md:!size-11">
            <PlusIcon className="size-3 md:size-5" />
          </div>
          <div className={cn("icon-container", "!rounded-xl !size-8 md:!size-11")}>
            <GearIcon className="size-4 md:size-5" />
          </div>
        </div>
        <div className="sm:bg-blue-2 bg-transparent flex items-center gap-2 rounded-full px-5 py-2.5 text-blue-6">
          <WaveIcon className="size-5 stroke-2" />
          <span className="font-inter hidden sm:inline text-sm font-semibold">Use voice mode</span>
        </div>
      </div>
    </div>
  )
}