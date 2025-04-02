import AletHexagonIcon from "@/public/icon/alert-hexagon.svg"
import MicIcon from "@/public/icon/mic.svg"
import StopRecIcon from "@/public/icon/stop-rec.svg"
import PauseRecIcon from "@/public/icon/pause-rec.svg"
import RecIndicator from "@/components/RecIndicator"

export default function AudioRec() {
  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl py-1 bg-grey-400 text-grey-800">
        <div className="flex items-center gap-1">
          <AletHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">Max audio recording length is 4 minutes</span>
        </div>
      </div>
      <div className="w-full min-h-100 flex items-center rounded-b-2xl justify-center border border-t-0 border-grey-400">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RecIndicator />
            <div className="w-8 aspect-square flex items-center justify-center rounded-full bg-grey-400">
              <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6" stroke="#3C3F3E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <button className="rounded-full cursor-pointer flex flex-1 justify-center items-center gap-2 bg-secondary text-white py-3 px-8">
            <MicIcon width={12} />
            <span className="font-inter text-sm font-semibold">Start</span>
          </button>
          <button className="rounded-full cursor-pointer flex flex-1 justify-center items-center gap-2 bg-[#F5FAFF] text-[#2E90FA] py-3 px-8">
            <MicIcon width={12} />
            <span className="font-inter text-sm font-semibold">Resume</span>
          </button>
          <button className="rounded-full cursor-pointer flex flex-1 justify-center items-center gap-2 bg-[#F5FAFF] text-[#2E90FA] py-3 px-8">
            <PauseRecIcon width={12} />
            <span className="font-inter text-sm font-semibold">Pause</span>
          </button>
          <button className="rounded-full cursor-pointer flex flex-1 justify-center items-center gap-2 bg-[#FEF3F2] text-[#F97066] py-3 px-8">
            <StopRecIcon width={15} />
            <span className="font-inter text-sm font-semibold">End</span>
          </button>
        </div>
      </div>
    </div>
  )
}