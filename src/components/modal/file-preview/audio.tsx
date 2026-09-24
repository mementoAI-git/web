import { useEffect, useRef } from "react";
import AudioPlayer from "@/components/player/audio-player";
import type { FilePreviewItem } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";

export interface AudioPreviewProps extends FilePreviewItem { isActive: boolean }

export default function AudioPreview({ isActive, ...props }: AudioPreviewProps) {
  const { src, onError } = useSignedMediaAccess(props);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (!isActive) audioRef.current?.pause(); }, [isActive]);
  return <div className="flex w-full max-w-[618px] rounded-xl bg-background p-4 shadow-2xl"><AudioPlayer src={src} onError={onError} alt={props.name} id={props._id} duration={props.duration} audioRef={audioRef} /></div>;
}
