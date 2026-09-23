import { useEffect, useRef } from "react";
import VideoPlayer from "@/components/player/video-player";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import ActionBtn from "./action-btns";
import type { FilePreviewItem } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";

export interface VideoPreviewProps extends FilePreviewItem {
  isActive: boolean;
}

export default function VideoPreview({ isActive, ...props }: VideoPreviewProps) {
  const { src, onError } = useSignedMediaAccess(props);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const { refs, floatingStyles } = useFloating({
    placement: "top-end",
    middleware: [offset(16), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative mx-auto w-full max-w-full sm:max-w-[90%] md:max-w-[90%] lg:max-w-[90%]">
      <div ref={refs.setReference} className="relative h-80 w-full overflow-hidden rounded-[9px] sm:h-96 md:h-100 lg:h-120">
        <VideoPlayer src={src} onError={onError} videoRef={videoRef} />
      </div>
      <div ref={refs.setFloating} style={floatingStyles} className="absolute z-10">
        <ActionBtn {...props} />
      </div>
    </div>
  );
}
