"use client";

import { useEffect, useMemo, useState } from "react";
import { parseBlob, selectCover } from "music-metadata";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import { TimesIcon } from "@/components/icons";
import type { IOnUploadPayload } from "@/utility/interface";
import { cn } from "@/lib/utils";
import { extractDocxPreview, extractPlainTextPreview } from "./document-preview";
import { displayFileName, voiceNoteLabel } from "@/utility/file-label";
import { VoiceNoteTile } from "@/components/recorder/voice-note-tile";
import { useModal } from "@/hooks/use-modal";
import { getUploadDisplayKind, resolveUploadMimeType } from "./upload-display";

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function useAudioThumbnail(audioSource: File | string | null | undefined): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!audioSource) return;

    const loadCover = async () => {
      try {
        let blob: Blob;
        if (typeof audioSource === "string") {
          const res = await fetch(audioSource);
          blob = await res.blob();
        } else {
          blob = audioSource;
        }
        const metadata = await parseBlob(blob);
        const picture = selectCover(metadata.common?.picture);
        if (!picture?.data) {
          setThumbnail(null);
          return;
        }

        const format = picture.format || "image/jpeg";
        let binary = "";
        for (let i = 0; i < picture.data.length; i++) {
          binary += String.fromCharCode(picture.data[i]);
        }
        setThumbnail(`data:${format};base64,${btoa(binary)}`);
      } catch {
        setThumbnail(null);
      }
    };

    void loadCover();
  }, [audioSource]);

  return thumbnail;
}

function useImagePreview(file: IOnUploadPayload, mimeType: string): string | null {
  return useMemo(() => {
    if (!mimeType.startsWith("image/")) return null;
    if (file.base64) return file.base64;
    if (file.file) return URL.createObjectURL(file.file);
    return file.uploadedFile?.url ?? null;
  }, [file, mimeType]);
}

function useObjectUrlCleanup(source: string | null, file: File | null | undefined) {
  useEffect(() => {
    if (!source || !file || !source.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(source);
  }, [file, source]);
}

function usePdfThumbnail(pdfSource: File | string | null | undefined): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfSource) return;

    const loadPdf = async () => {
      try {
        const src =
          typeof pdfSource === "string"
            ? { url: pdfSource }
            : { data: await pdfSource.arrayBuffer() };
        const pdf = await getDocument(src).promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetSize = 70;
        const scale = Math.min(targetSize / baseViewport.width, targetSize / baseViewport.height);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setThumbnail(null);
          return;
        }
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        setThumbnail(null);
      }
    };

    void loadPdf();
  }, [pdfSource]);

  return thumbnail;
}

function useDocumentPreview(
  file: IOnUploadPayload,
  mimeType: string,
): { imageUrl: string | null; textPreview: string | null } {
  const [preview, setPreview] = useState<{ imageUrl: string | null; textPreview: string | null }>(
    { imageUrl: null, textPreview: null },
  );

  useEffect(() => {
    const source = file.file ?? file.uploadedFile?.url ?? null;
    if (!source) {
      setPreview({ imageUrl: null, textPreview: null });
      return;
    }

    const loadPreview = async () => {
      try {
        let blob: Blob;
        if (typeof source === "string") {
          const res = await fetch(source);
          blob = await res.blob();
        } else {
          blob = source;
        }

        if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          setPreview(extractDocxPreview(await blob.arrayBuffer()));
          return;
        }

        if (mimeType === "text/plain") {
          setPreview({ imageUrl: null, textPreview: extractPlainTextPreview(await blob.text()) });
          return;
        }
      } catch {
        /* ignore */
      }

      setPreview({ imageUrl: null, textPreview: null });
    };

    void loadPreview();
  }, [file.file, file.uploadedFile?.url, mimeType]);

  return preview;
}

function useVideoThumbnail(videoSource: File | string | null | undefined): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!videoSource) return;

    const url = typeof videoSource === "string" ? videoSource : URL.createObjectURL(videoSource);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      const seekTime = Number.isFinite(duration) && duration > 0 ? Math.min(1, duration * 0.1) : 0;
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setThumbnail(null);
          return;
        }
        ctx.drawImage(video, 0, 0);
        setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        setThumbnail(null);
      }
    };

    const handleError = () => setThumbnail(null);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.src = url;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.src = "";
      if (typeof videoSource !== "string") URL.revokeObjectURL(url);
    };
  }, [videoSource]);

  return thumbnail;
}

function FileInfoTile({
  file,
  mimeType,
  compact,
  textPreview,
}: {
  file: IOnUploadPayload;
  mimeType: string;
  compact: boolean;
  textPreview?: string | null;
}) {
  const name = file.file?.name || file.uploadedFile?.name || "Attachment";
  const voiceLabel = voiceNoteLabel(name);
  const extension = !voiceLabel && name.includes(".") ? name.split(".").pop()?.toUpperCase() : null;
  const shortName = voiceLabel ?? name.replace(/\.[^.]+$/, "");
  const typeLabel = voiceLabel ? "voice" : mimeType.split("/")[0] || "file";

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between border border-black/5 bg-gradient-to-br from-[#fbf5eb] to-[#f2eee8]",
        compact ? "rounded-[14px] p-2.5" : "rounded-[18px] p-3",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-white/80 px-2 py-0.5 font-inter text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6b6258]">
          {typeLabel}
        </span>
        {extension ? (
          <span className="font-inter text-[10px] font-semibold text-[#846633]">{extension}</span>
        ) : null}
      </div>
      <div className="mt-2 min-w-0">
        {textPreview ? (
          <p className="line-clamp-4 whitespace-pre-line break-words font-geist text-[10px] leading-[1.35] text-[#2f2417]">
            {textPreview}
          </p>
        ) : (
          <p className={cn("break-words font-geist text-[#1e1e1e]", compact ? "line-clamp-2 text-[11px] font-medium leading-4" : "line-clamp-3 text-[13px] font-medium leading-5")}>
            {shortName}
          </p>
        )}
      </div>
    </div>
  );
}

function AudioThumbnail({
  file,
  mimeType,
  compact,
  className,
}: {
  file: IOnUploadPayload;
  mimeType: string;
  compact: boolean;
  className: string;
}) {
  const audioSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = useAudioThumbnail(audioSource);
  const imageSource = useImagePreview(file, mimeType);
  useObjectUrlCleanup(imageSource, file.file);
  const src = thumbnail ?? imageSource;
  if (!src) return <FileInfoTile file={file} mimeType={mimeType} compact={compact} />;
  return <img src={src} className={className} alt="" />;
}

function VideoThumbnail({
  file,
  mimeType,
  compact,
  className,
}: {
  file: IOnUploadPayload;
  mimeType: string;
  compact: boolean;
  className: string;
}) {
  const videoSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = useVideoThumbnail(videoSource);
  const imageSource = useImagePreview(file, mimeType);
  useObjectUrlCleanup(imageSource, file.file);
  const src = thumbnail ?? imageSource;
  if (!src) return <FileInfoTile file={file} mimeType={mimeType} compact={compact} />;
  return <img src={src} className={className} alt="" />;
}

function PdfThumbnail({
  file,
  mimeType,
  compact,
  className,
}: {
  file: IOnUploadPayload;
  mimeType: string;
  compact: boolean;
  className: string;
}) {
  const pdfSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = usePdfThumbnail(pdfSource);
  const imageSource = useImagePreview(file, mimeType);
  useObjectUrlCleanup(imageSource, file.file);
  const src = thumbnail ?? imageSource;
  if (!src) return <FileInfoTile file={file} mimeType={mimeType} compact={compact} />;
  return <img src={src} className={className} alt="" />;
}

function DocumentThumbnail({
  file,
  mimeType,
  compact,
  className,
}: {
  file: IOnUploadPayload;
  mimeType: string;
  compact: boolean;
  className: string;
}) {
  const { imageUrl, textPreview } = useDocumentPreview(file, mimeType);
  if (imageUrl) return <img src={imageUrl} className={className} alt="" />;

  return <FileInfoTile file={file} mimeType={mimeType} compact={compact} textPreview={textPreview} />;
}

export interface FileThumbnailsProps {
  files: IOnUploadPayload[];
  onRemove: (id: string) => void;
  onRetry?: (file: IOnUploadPayload) => void;
  variant?: "default" | "composer-rail" | "media-inline";
}

export function FileThumbnails({
  files,
  onRemove,
  onRetry,
  variant = "default",
}: FileThumbnailsProps) {
  const { push } = useModal();
  if (files.length === 0) return null;

  const isComposerRail = variant === "composer-rail";
  const isMediaInline = variant === "media-inline";
  const compact = isMediaInline || isComposerRail;
  const displayFiles = files;

  return (
    <div className={cn("w-full", isMediaInline ? "overflow-visible" : "overflow-x-auto hide-scrollbar")}>
      <div
        data-testid={isMediaInline ? "media-inline-flow" : undefined}
        className={cn(
          isMediaInline ? "flex flex-wrap gap-2" : "flex w-full pb-1",
          isComposerRail ? "gap-2" : "gap-3",
        )}
      >
        {displayFiles.map((file) => {
          const mimeType = resolveUploadMimeType(file);
          const isImage = mimeType.startsWith("image/");
          const isVideo = mimeType.startsWith("video/");
          const isAudio = mimeType.startsWith("audio/");
          const isDocument = getUploadDisplayKind(mimeType) === "document";
          if (isAudio) {
            const uploaded = file.uploadedFile;
            const label = displayFileName(file.file?.name || uploaded?.name) || "Voice note";
            const uploading = !uploaded?._id && !file.uploadFailed;
            return (
              <div key={file.id} className="relative shrink-0" data-testid={isMediaInline ? `media-inline-file-tile-${file.id}` : undefined}>
                <VoiceNoteTile
                  id={uploaded?._id || file.id}
                  src={uploaded?.url || file.base64 || ""}
                  duration={file.duration ?? uploaded?.duration}
                  label={label}
                  onRemove={() => onRemove(file.id)}
                  onOpen={uploaded?._id ? () => push?.("file-preview", { files: [{ ...uploaded, duration: file.duration ?? uploaded.duration }], readOnly: true }) : undefined}
                />
                {file.uploadFailed && onRetry ? (
                  <div className="absolute inset-0 z-30 flex items-end justify-center rounded-2xl bg-overlay-backdrop p-1">
                    <button type="button" aria-label={`Retry ${label}`} onClick={() => onRetry(file)} className="rounded-full bg-bg-neutral-solid px-2.5 py-1 font-inter text-[11px] font-semibold text-text-neutral-strong">Retry</button>
                  </div>
                ) : uploading ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-2">
                    <div className="h-1 overflow-hidden rounded-full bg-fill-neutral-strong/20">
                      <div className="h-full rounded-full bg-fill-brand-strong transition-[width]" style={{ width: `${Math.max(0, Math.min(100, file.progress ?? 0))}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          }
          const imgSrc = isImage ? (file.base64 || file.uploadedFile?.url || "") : "";
          const sizeBytes = file.file?.size ?? (typeof file.uploadedFile?.size === "number" ? file.uploadedFile.size : 0);
          const sizeLabel = sizeBytes ? formatFileSize(sizeBytes) : "";
          const isUploading = !file.uploadedFile?._id && !file.uploadFailed;
          const frameClassName =
            isMediaInline ?
              "relative size-[72px] overflow-hidden rounded-[14px] bg-[#f3eee6] shadow-[inset_0_0_0_1px_rgba(15,7,0,0.06)]"
            : isComposerRail ?
              "relative h-[82px] w-[84px] overflow-hidden rounded-[14px] bg-[#f3eee6]"
            : "relative h-[70px] w-[70px] overflow-hidden rounded-xl bg-fill-neutral-weaker";
          const assetClassName =
            isMediaInline ? "h-full w-full rounded-[14px] object-cover object-center"
            : isComposerRail ? "h-full w-full rounded-[14px] object-cover"
            : "h-full w-full rounded-xl object-cover";

          return (
            <div
              key={file.id}
              data-testid={isMediaInline ? `media-inline-file-tile-${file.id}` : undefined}
              className={cn("relative shrink-0", isMediaInline && "size-[72px]")}
            >
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className={
                  isMediaInline ?
                    "absolute right-1 top-1 z-50 flex size-5 items-center justify-center rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/70"
                  : isComposerRail ?
                    "absolute right-1.5 top-1.5 z-50 flex size-5 items-center justify-center rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/70"
                  : "absolute right-1 top-1 z-50 flex size-6 items-center justify-center rounded-full bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/70"
                }
                aria-label="Remove attachment"
              >
                <TimesIcon
                  width={isMediaInline ? 7 : isComposerRail ? 7 : 8}
                  height={isMediaInline ? 7 : isComposerRail ? 7 : 8}
                />
              </button>

              <div className={frameClassName}>
                {isVideo ? (
                  <VideoThumbnail file={file} mimeType={mimeType} compact={compact} className={assetClassName} />
                ) : isAudio ? (
                  <AudioThumbnail file={file} mimeType={mimeType} compact={compact} className={assetClassName} />
                ) : mimeType === "application/pdf" ? (
                  <PdfThumbnail file={file} mimeType={mimeType} compact={compact} className={assetClassName} />
                ) : isDocument ? (
                  <DocumentThumbnail file={file} mimeType={mimeType} compact={compact} className={assetClassName} />
                ) : isImage ? (
                  <img src={imgSrc} className={assetClassName} alt="" />
                ) : (
                  <FileInfoTile file={file} mimeType={mimeType} compact={compact} />
                )}

                {file.uploadFailed && onRetry ? (
                  <div className="absolute inset-0 flex items-end justify-center bg-overlay-backdrop p-1">
                    <button type="button" aria-label={`Retry ${file.file?.name ?? file.uploadedFile?.name ?? "attachment"}`} onClick={() => onRetry(file)} className="min-h-8 rounded-full bg-bg-neutral-solid px-2 text-xs font-semibold text-text-neutral-strong focus-visible:outline-2 focus-visible:outline-stroke-neutral-strong">Retry</button>
                  </div>
                ) : isUploading ? (
                  <div className="absolute inset-0 flex flex-col justify-end bg-black/35">
                    <div className={isMediaInline ? "px-2 pb-2 pt-6" : "px-2 pb-2 pt-8"}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-inter text-[10px] font-semibold text-white">
                          {file.progress >= 80 ? "Processing" : `${file.progress}%`}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
                        <div
                          className="h-full rounded-full bg-white transition-[width]"
                          style={{ width: `${Math.max(0, Math.min(100, file.progress ?? 0))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {sizeLabel && !isUploading && !file.uploadFailed ? (
                  <div
                    className={
                      isMediaInline ?
                        "absolute bottom-1 left-1.5 w-fit overflow-hidden rounded-full bg-black/55 px-1.5 py-0.5"
                      : isComposerRail ?
                        "absolute bottom-1 left-1 w-fit overflow-hidden rounded-full bg-black/55 px-1.5 py-0.5"
                      : "absolute bottom-1 left-1 w-fit overflow-hidden rounded-full bg-black/55 px-1.5 py-0"
                    }
                  >
                    <span
                      className={
                        isMediaInline ?
                          "font-inter text-[8px] font-semibold whitespace-nowrap text-white"
                        : isComposerRail ?
                          "font-inter text-[8px] font-semibold whitespace-nowrap text-white"
                        : "font-inter text-[9px] font-semibold whitespace-nowrap text-white"
                      }
                    >
                      {sizeLabel}
                    </span>
                  </div>
                ) : null}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
