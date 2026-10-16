import { useState } from "react";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import type { IFile } from "@/utility/interface";

export default function VideoThumbnail({ file, label, memoryId, className = "size-full object-cover" }: {
  file: IFile;
  label?: string;
  memoryId?: string;
  className?: string;
}) {
  const { attachment, src, onError } = useSignedMediaAccess(file, undefined, { memoryId });
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);

  if (attachment.thumbnail && failedThumbnail !== attachment.thumbnail) {
    return <img src={attachment.thumbnail} alt={label || `Preview of ${file.name}`} className={className} loading="lazy" onError={() => setFailedThumbnail(attachment.thumbnail!)} />;
  }

  return <video src={src} aria-label={label || `Video thumbnail for ${file.name}`} muted playsInline preload="metadata" className={className} onError={onError} onLoadedMetadata={(event) => {
    const video = event.currentTarget;
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration * 0.1);
  }} />;
}
