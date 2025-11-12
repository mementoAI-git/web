import AudioPlayer from "@/components/player/audio-player";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import ActionBtn from "./action-btns";
import type { FilePreviewItem } from "./index";

export default function AudioPreview(props: FilePreviewItem) {
  const { refs, floatingStyles } = useFloating({
    placement: "top-end",
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative mx-auto w-full max-w-full sm:max-w-96 md:max-w-80 lg:max-w-[618px]">
      <div ref={refs.setReference} className="modal-container flex w-full !min-h-80 sm:!min-h-100 lg:!min-h-126">
        <AudioPlayer src={props.url} alt={props.name} id={props._id} duration={props.duration} />
      </div>
      <div ref={refs.setFloating} style={floatingStyles} className="absolute z-10">
        <ActionBtn {...props} />
      </div>
    </div>
  );
}

