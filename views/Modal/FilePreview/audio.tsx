import AudioPlayer from "@/components/Player/AudioPlayer";
import ActionBtn from "./action-btns";
import { IFilePreviewItem } from ".";
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

export default function AudioPreview(props: IFilePreviewItem) {
  const { refs, floatingStyles } = useFloating({
    placement: 'top-end',
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative w-full max-w-full sm:max-w-96 md:max-w-80 lg:max-w-154.5 mx-auto">
      <div ref={refs.setReference} className="modal-container w-full flex !min-h-80 sm:!min-h-100 lg:!min-h-126">
        <AudioPlayer
          src={props.url}
          alt={props.name}
          id={props._id}
          duration={props.duration}
        />
      </div>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="absolute z-10"
      >
        <ActionBtn {...props} />
      </div>
    </div>
  );
}