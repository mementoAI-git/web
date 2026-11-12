import { useEffect, useRef } from "react";
import TranscriptAudioPlayer from "@/components/player/transcript-audio-player";
import type { FilePreviewItem } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { voiceNoteLabel } from "@/utility/file-label";

export interface AudioPreviewProps extends FilePreviewItem { isActive: boolean }

export default function AudioPreview({ isActive, ...props }: AudioPreviewProps) {
  const { src, onError } = useSignedMediaAccess(props);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (!isActive) audioRef.current?.pause(); }, [isActive]);
  return (
    <TranscriptAudioPlayer
      key={props._id || src}
      src={src}
      onError={onError}
      fileId={props._id}
      name={props.name}
      // In-app voice notes and recorded conversations from either app.
      isVoice={Boolean(voiceNoteLabel(props.name))}
      thumbnail={props.thumbnail}
      duration={props.duration}
      isActive={isActive}
      audioRef={audioRef}
    />
  );
}
