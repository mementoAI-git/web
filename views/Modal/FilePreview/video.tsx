import VideoPlayer from "@/components/Player/VideoPlayer";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";

export default function VideoPreview(props: IFilePreviewItem) {
  return (
    <div className="w-[90%] mx-auto">
      <ActionBtn {...props} />
      <div className="w-full relative h-120 rounded-[9px] overflow-hidden">
        <div className="size-full top-0 right-0">
          <VideoPlayer src={props.url} />
        </div>
      </div>
    </div>
  )
}