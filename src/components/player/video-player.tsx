import type { RefObject } from "react";
import UiVideoPlayer from "@/components/ui/video-player";

export default function VideoPlayer({
  src,
  videoRef,
}: {
  src: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
}) {
  return (
    <UiVideoPlayer
      src={src}
      videoRef={videoRef}
      className="size-full max-w-none rounded-none bg-black shadow-none"
      videoClassName="size-full object-cover"
      controlsClassName="max-w-none"
      autoPlay
      preload="auto"
    />
  );
}
