import { useEffect, useRef } from "react";
import VoicePlayer from "@/components/player/voice-player";
import type { FilePreviewItem } from "./index";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { recordedAtFromName, voiceNoteLabel } from "@/utility/file-label";

export interface AudioPreviewProps extends FilePreviewItem { isActive: boolean }

export default function AudioPreview({ isActive, ...props }: AudioPreviewProps) {
  const { src, onError } = useSignedMediaAccess(props);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (!isActive) audioRef.current?.pause(); }, [isActive]);
  return (
    <VoicePlayer
      src={src}
      onError={onError}
      id={props._id}
      title={voiceNoteLabel(props.name) ? "Voice note" : props.name || "Audio"}
      recordedAt={recordedAtFromName(props.name)}
      duration={props.duration}
      audioRef={audioRef}
    />
  );
}
