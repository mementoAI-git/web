import { useEffect, useRef } from "react";
import VideoPlayer from "@/components/player/video-player";
import type { FilePreviewItem } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";

export interface VideoPreviewProps extends FilePreviewItem { isActive: boolean }

export default function VideoPreview({ isActive, ...props }: VideoPreviewProps) {
  const { src, onError } = useSignedMediaAccess(props);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (!isActive) videoRef.current?.pause(); }, [isActive]);
  return <div className="h-full max-h-[min(720px,calc(100vh-160px))] w-full max-w-[1200px] overflow-hidden rounded-xl bg-overlay-backdrop shadow-2xl"><VideoPlayer src={src} onError={onError} videoRef={videoRef} /></div>;
}
