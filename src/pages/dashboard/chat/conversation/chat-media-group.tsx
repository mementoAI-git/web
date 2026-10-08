import { FileText, Mic, Play } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { cn } from "@/lib/utils";
import {
  classifyConversationFile,
  normalizeChatAttachment,
  type ChatAttachment,
  type ConversationPreviewFile,
} from "./conversation-assets";

type ChatMediaGroupProps = {
  attachments: ChatAttachment[];
  sharedAt?: string;
};

function VisualTile({
  file,
  index,
  files,
  sharedAt,
  className,
  overflowCount = 0,
}: {
  file: ConversationPreviewFile;
  index: number;
  files: ConversationPreviewFile[];
  sharedAt?: string;
  className?: string;
  overflowCount?: number;
}) {
  const { push } = useModal();
  const { src, onError } = useSignedMediaAccess(file);
  const kind = classifyConversationFile(file);
  const openViewer = () => push?.("file-preview", { files, startIndex: index });

  return (
    <button
      type="button"
      onClick={openViewer}
      aria-label={`Open ${file.name || "file"} in viewer`}
      className={cn(
        "group relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-lg bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong",
        className,
      )}
      data-shared-at={sharedAt}
    >
      {kind === "video" ? (
        <>
          <video
            src={src}
            onError={onError}
            className="size-full object-cover"
            muted
            preload="metadata"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-overlay-backdrop/40">
            <span className="flex size-10 items-center justify-center rounded-full bg-background/90 text-text-neutral-strong shadow-sm">
              <Play className="ml-0.5 size-5" fill="currentColor" aria-hidden />
            </span>
          </span>
        </>
      ) : (
        <img
          src={src}
          onError={onError}
          alt={file.name}
          className="size-full object-cover transition-opacity group-hover:opacity-90"
        />
      )}
      {overflowCount > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center bg-overlay-backdrop/55 font-geist text-2xl font-semibold text-white">
          +{overflowCount}
        </span>
      ) : null}
    </button>
  );
}

function CompactFileRow({
  file,
  index,
  files,
}: {
  file: ConversationPreviewFile;
  index: number;
  files: ConversationPreviewFile[];
}) {
  const { push } = useModal();
  const { src } = useSignedMediaAccess(file);
  const kind = classifyConversationFile(file);
  const Icon = kind === "audio" ? Mic : FileText;
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-brand-weak text-text-brand-strong">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-geist text-sm font-medium text-text-neutral-strong">
          {file.name || (kind === "audio" ? "Audio" : "File")}
        </span>
        <span className="block truncate font-inter text-xs text-text-neutral-weak">
          {kind === "audio" ? "Audio" : file.type || "Document"}
        </span>
      </span>
    </>
  );
  const classes = "sky-card flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg border border-stroke-neutral-weaker bg-fill-neutral-weaker px-3 py-2 text-left transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-brand-strong";
  return kind === "audio" ? (
    <button type="button" onClick={() => push?.("file-preview", { files, startIndex: index })} aria-label={`Open ${file.name || "file"} in viewer`} className={classes}>{content}</button>
  ) : (
    <a href={src} download={file.name} aria-label={`Download ${file.name || "file"}`} className={classes}>{content}</a>
  );
}

export function ChatMediaGroup({ attachments, sharedAt }: ChatMediaGroupProps) {
  if (!attachments.length) return null;
  const files: ConversationPreviewFile[] = attachments.map((attachment) => ({
    ...normalizeChatAttachment(attachment),
    sharedAt,
  }));
  const visualFiles = files.filter((file) => ["image", "video"].includes(classifyConversationFile(file)));
  const visual = visualFiles.map((file, index) => ({ file, index }));
  const compactFiles = files.filter((file) => !["image", "video"].includes(classifyConversationFile(file)));
  const audioFiles = compactFiles.filter((file) => classifyConversationFile(file) === "audio");
  const compact = compactFiles.map((file) => ({
    file,
    index: classifyConversationFile(file) === "audio" ? audioFiles.indexOf(file) : 0,
  }));
  const visibleVisual = visual.slice(0, visual.length >= 4 ? 4 : visual.length);
  const visualLayout =
    visual.length === 1 ? "single" : visual.length <= 3 ? "row" : "grid";

  return (
    <div className="space-y-2" data-testid="chat-media-group">
      {visual.length ? (
        <div
          className={cn(
            "w-full max-w-[380px] overflow-hidden rounded-xl bg-fill-neutral-weaker p-1",
            visualLayout === "row" && "grid grid-flow-col auto-cols-fr gap-1",
            visualLayout === "grid" && "grid grid-cols-2 gap-1",
          )}
          data-layout={visualLayout}
        >
          {visibleVisual.map(({ file, index }, visibleIndex) => (
            <VisualTile
              key={file._id || `${file.name}-${index}`}
              file={file}
              index={index}
              files={visualFiles}
              sharedAt={sharedAt}
              overflowCount={
                visualLayout === "grid" && visibleIndex === 3
                  ? Math.max(0, visual.length - 4)
                  : 0
              }
              className={cn(
                visualLayout === "single" && "max-h-[420px] w-full",
                visualLayout === "single" && "[&_img]:h-auto [&_img]:max-h-[420px] [&_img]:w-auto [&_img]:max-w-full [&_img]:object-contain",
                visualLayout !== "single" && "aspect-[4/3] w-full",
              )}
            />
          ))}
        </div>
      ) : null}
      {compact.length ? (
        <div className="grid w-full max-w-[380px] gap-2 sm:grid-cols-2">
          {compact.map(({ file, index }) => (
            <CompactFileRow key={file._id || `${file.name}-${index}`} file={file} index={index} files={audioFiles} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
