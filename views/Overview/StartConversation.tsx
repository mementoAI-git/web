import TextIcon from "@/public/icon/text.svg";
import CameraIcon from "@/public/icon/video.svg";
import MicIcon from "@/public/icon/mic.svg";
import ImageIcon from "@/public/icon/image.svg";
import ClipIcon from "@/public/icon/clip.svg";
import PlanepaperIcon from "@/public/icon/plane-paper.svg";
import { useModal } from "@/hooks/use-modal";
import { useState } from "react";

export default function StartConversation() {
  const [body, setBody] = useState("")
  const { open } = useModal()

  const handleAddMemory = (type: string = "text") => {
    open("create-memory", { payload: { body }, type })
  }

  return (
    <div className="flex flex-1 flex-col justify-between rounded-2xl bg-grey-700 p-10">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="What’s on your mind today? click below to start typing"
        className="h-fit w-full flex-1 resize-none bg-transparent outline-0 placeholder:font-inter placeholder:text-[#949494]"
      ></textarea>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#344054]">
          {[
            { icon: <TextIcon width={16} height={16} />, onCick: () => handleAddMemory() },
            { icon: <CameraIcon width={23} height={21} />, onCick: () => handleAddMemory("video") },
            { icon: <ImageIcon width={18} height={18} />, onClick: handleAddMemory() },
            { icon: <MicIcon width={14} height={20} />, onCick: () => handleAddMemory("audio") },
            { icon: <ClipIcon width={17.98} height={19} />, },
            // { icon: <PlanepaperIcon width={19.23} height={19.23} />, },
          ].map((d, i) => (
            <div
              className="flex aspect-square w-12 shrink-0 cursor-pointer items-center justify-center"
              key={i}
              onClick={d.onCick}
            >
              {d.icon}
            </div>
          ))}
        </div>
        <button onClick={() => handleAddMemory()} className="btn !text-grey-400">Add new</button>
      </div>
    </div>
  );
}
