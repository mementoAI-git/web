import type { ReactEventHandler, RefObject } from "react";
import UiVideoPlayer from "@/components/ui/video-player";

export default function VideoPlayer({
  src,
  videoRef,
  onError,
}: {
  src: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
  onError?: ReactEventHandler<HTMLVideoElement>;
}) {
  return (
    <UiVideoPlayer
      src={src}
      videoRef={videoRef}
      onError={onError}
      className="size-full max-w-none rounded-none bg-black shadow-none"
      videoClassName="size-full object-cover"
      controlsClassName="max-w-none"
      autoPlay
      preload="auto"
    />
  );
}
