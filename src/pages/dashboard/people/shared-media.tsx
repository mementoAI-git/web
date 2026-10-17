import type { SharedItem } from "@/api/people";
export function SharedMedia({
  attachments,
  title,
}: {
  attachments: SharedItem["attachments"];
  title: string;
}) {
  return (
    <div className="mt-4 space-y-3">
      {attachments.map((file) => (
        <div key={file._id}>
          {file.status === "processing" ? (
            <p className="text-sm text-text-neutral-weak">
              Media is still processing.
            </p>
          ) : file.status === "failed" ? (
            <p className="text-sm text-text-error-strong">
              This media couldn’t be processed.
            </p>
          ) : file.type.startsWith("image/") ? (
            <img
              src={file.url}
              alt={title}
              loading="lazy"
              className="max-h-80 w-full rounded-xl object-contain bg-bg-neutral-weaker"
            />
          ) : file.type.startsWith("audio/") ? (
            <audio
              controls
              preload="none"
              src={file.url}
              aria-label={`Audio: ${title}`}
              className="w-full"
            />
          ) : file.type.startsWith("video/") ? (
            <video
              controls
              preload="none"
              src={file.url}
              poster={file.thumbnail || undefined}
              aria-label={`Video: ${title}`}
              className="max-h-96 w-full rounded-xl"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
