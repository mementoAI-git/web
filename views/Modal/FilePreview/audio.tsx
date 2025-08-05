import AudioPlayer from "@/components/Player/AudioPlayer";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";

export default function AudioPreview(props: IFilePreviewItem) {
  return (
    <div className="w-154.5 mx-auto">
      <ActionBtn {...props} />
      <div className="modal-container w-full flex !min-h-126">
        <AudioPlayer
          src={props.url}
          alt={props.name}
          id={props._id}
          duration={props.duration}
        />
      </div>
    </div>
  );
}