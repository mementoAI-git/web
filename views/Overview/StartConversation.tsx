import TextIcon from "@/public/icon/text.svg";
import CameraIcon from "@/public/icon/camera.svg";
import MicIcon from "@/public/icon/mic.svg";
import ImageIcon from "@/public/icon/image.svg";
import ClipIcon from "@/public/icon/clip.svg";
import PlanepaperIcon from "@/public/icon/plane-paper.svg";

export default function StartConversation() {
  return (
    <div className="flex flex-1 flex-col justify-between rounded-2xl bg-grey-700 p-10">
      <textarea
        placeholder="What’s on your mind today? click below to start typing"
        className="h-fit w-full flex-1 resize-none bg-transparent outline-0 placeholder:font-inter placeholder:text-[#949494]"
      ></textarea>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[#344054]">
          {[
            <TextIcon width={16} height={16} />,
            <CameraIcon width={20} height={19} />,
            <ImageIcon width={18} height={18} />,
            <MicIcon width={14} height={20} />,
            <ClipIcon width={17.98} height={19} />,
            <PlanepaperIcon width={19.23} height={19.23} />,
          ].map((d, i) => (
            <div
              className="flex aspect-square w-12 shrink-0 cursor-pointer items-center justify-center"
              key={i}
            >
              {d}
            </div>
          ))}
        </div>
        <button className="btn !text-grey-400">Add new</button>
      </div>
    </div>
  );
}
