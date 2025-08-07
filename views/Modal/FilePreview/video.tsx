import VideoPlayer from "@/components/Player/VideoPlayer";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

export default function VideoPreview(props: IFilePreviewItem) {
  const { refs, floatingStyles } = useFloating({
    placement: 'top-end',
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative w-full max-w-full sm:max-w-[90%] md:max-w-[90%] lg:max-w-[90%] mx-auto">
      <div ref={refs.setReference} className="w-full relative h-80 sm:h-96 md:h-100 lg:h-120 rounded-[9px] overflow-hidden">
        <div className="size-full top-0 right-0">
          <VideoPlayer src={props.url} />
        </div>
      </div>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="absolute z-10"
      >
        <ActionBtn {...props} />
      </div>
    </div>
  )
}