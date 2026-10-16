import { useState } from "react";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import { inferMimeType, uploadMimeBaseType } from "@/utility/constant";
import type { IFile, IMemory } from "@/utility/interface";

const imageClass =
  "size-10 shrink-0 rounded-lg object-cover bg-fill-neutral-weak";
function isImage(file: IFile) {
  return uploadMimeBaseType(
    file.type || inferMimeType(file.name) || inferMimeType(file.url),
  ).startsWith("image/");
}
function MediaThumbnail({ file, memoryId }: { file: IFile; memoryId: string }) {
  const { attachment, onError } = useSignedMediaAccess(file, undefined, {
    memoryId,
  });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const preview = attachment.thumbnail || attachment.url;
  const fallback = getQuestionIdenticonUrl(memoryId);
  const src = failedSrc === preview ? fallback : preview;
  const handleError = async () => {
    try {
      const refreshed = await onError();
      if ((refreshed.thumbnail || refreshed.url) === preview)
        setFailedSrc(preview);
    } catch {
      setFailedSrc(preview);
    }
  };
  return (
    <img
      src={src}
      alt=""
      className={imageClass}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={src === fallback ? undefined : () => void handleError()}
    />
  );
}
/** Artwork for list rows only; grid media rendering stays independent. */
export function StoryListThumbnail({ memory }: { memory: IMemory }) {
  const file = memory.attachments?.find(
    (attachment) =>
      attachment.thumbnail || (attachment.url && isImage(attachment)),
  );
  return file ? (
    <MediaThumbnail key={file._id} file={file} memoryId={memory._id} />
  ) : (
    <img
      src={getQuestionIdenticonUrl(memory._id)}
      alt=""
      className={imageClass}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
