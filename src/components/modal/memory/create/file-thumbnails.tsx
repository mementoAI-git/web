"use client";

import { useState, useEffect } from "react";
import { parseBlob, selectCover } from "music-metadata";
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";
import { TimesIcon } from "@/components/icons";
import type { IOnUploadPayload } from "@/utility/interface";
import { inferMimeType } from "@/utility/constant";

import imageUploadSvg from "@/assets/icon/Image Upload.svg";
import recUploadSvg from "@/assets/icon/rec upload - short.svg";
import videoUploadSvg from "@/assets/icon/Video Upload.svg";
import docUploadSvg from "@/assets/icon/Document Upload.svg";
import musicUploadSvg from "@/assets/icon/music upload - short.svg";

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function getFileThumbSvg(mimeType: string): string | null {
  if (mimeType.startsWith("image/")) return null;
  if (mimeType === "audio/webm" || mimeType === "audio/ogg") return recUploadSvg;
  if (mimeType.startsWith("audio/")) return musicUploadSvg;
  if (mimeType.startsWith("video/")) return videoUploadSvg;
  return docUploadSvg;
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
        if (picture?.data) {
          const format = picture.format || "image/jpeg";
          const bytes = picture.data;
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          setThumbnail(`data:${format};base64,${btoa(binary)}`);
        }
      } catch {
        setThumbnail(null);
      }
    };

    loadCover();
  }, [audioSource]);

  return thumbnail;
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
        if (ctx) {
          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
          });
          await renderTask.promise;
          setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
        }
      } catch {
        setThumbnail(null);
      }
    };

    loadPdf();
  }, [pdfSource]);

  return thumbnail;
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
      const seekTime =
        Number.isFinite(duration) && duration > 0 ? Math.min(1, duration * 0.1) : 0;
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
        }
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

function VideoThumbnail({
  file,
  fallbackSrc,
  ...imgProps
}: {
  file: IOnUploadPayload;
  fallbackSrc: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const videoSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = useVideoThumbnail(videoSource);
  const src = thumbnail ?? fallbackSrc;
  return <img {...imgProps} src={src} alt="" />;
}

function AudioThumbnail({
  file,
  fallbackSrc,
  ...imgProps
}: {
  file: IOnUploadPayload;
  fallbackSrc: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const audioSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = useAudioThumbnail(audioSource);
  const src = thumbnail ?? fallbackSrc;
  return <img {...imgProps} src={src} alt="" />;
}

function PdfThumbnail({
  file,
  fallbackSrc,
  ...imgProps
}: {
  file: IOnUploadPayload;
  fallbackSrc: string;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const pdfSource = file.file ?? file.uploadedFile?.url ?? null;
  const thumbnail = usePdfThumbnail(pdfSource);
  const src = thumbnail ?? fallbackSrc;
  return <img {...imgProps} src={src} alt="" />;
}

export interface FileThumbnailsProps {
  files: IOnUploadPayload[];
  onRemove: (id: string) => void;
}

export function FileThumbnails({ files, onRemove }: FileThumbnailsProps) {
  if (files.length === 0) return null;

  return (
    <div className="mt-6 flex justify-start items-start overflow-x-auto pt-2 px-4 hide-scrollbar">
      <div className="flex gap-3 pb-1 w-full">
        {files.map((f) => {
          const rawType = f.file?.type || f.uploadedFile?.type || "";
          const mimeType = rawType || inferMimeType(f.file?.name ?? f.uploadedFile?.name ?? f.uploadedFile?.url);
          const thumbSvg = getFileThumbSvg(mimeType);
          const isImage = mimeType.startsWith("image/");
          const isVideo = mimeType.startsWith("video/");
          const isAudio = mimeType.startsWith("audio/");
          const isPdf = mimeType === "application/pdf";
          const audioFallback = mimeType === "audio/webm" || mimeType === "audio/ogg" ? recUploadSvg : musicUploadSvg;
          const imgSrc = isImage ? (f.base64 || f.uploadedFile?.url || "") : (thumbSvg ?? imageUploadSvg);
          const sizeBytes =
            f.file?.size ?? (typeof f.uploadedFile?.size === "number" ? f.uploadedFile.size : 0);
          const sizeLabel = sizeBytes ? formatFileSize(sizeBytes) : "";
          const isUpl = f.progress !== undefined && f.progress !== 100;

          return (
            <div key={f.id} className="relative shrink-0">
              {/* X button */}
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute -top-2 -right-2 z-50 size-6 rounded-full bg-gray-100 hover:bg-gray-700 flex items-center justify-center transition-colors shadow border-2 border-white"
              >
                <TimesIcon width={8} height={8} />
              </button>

              <div className="w-[70px] h-[70px] rounded-xl overflow-visible relative bg-gray-100">
                {isVideo ? (
                  <VideoThumbnail
                    file={f}
                    fallbackSrc={videoUploadSvg}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : isAudio ? (
                  <AudioThumbnail
                    file={f}
                    fallbackSrc={audioFallback}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : isPdf ? (
                  <PdfThumbnail
                    file={f}
                    fallbackSrc={docUploadSvg}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <img
                    src={imgSrc}
                    className="w-full h-full object-cover rounded-xl"
                    alt=""
                  />
                )}

                {/* Upload progress overlay */}
                {isUpl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-inter text-white text-xs font-semibold">{f.progress}%</span>
                  </div>
                )}

                {/* Size pill */}
                {sizeLabel && (
                  <div className="absolute bottom-1 left-1 bg-black/55 rounded-full px-1.5 py-0 w-fit overflow-hidden">
                    <span className="font-inter text-white text-[9px] font-semibold whitespace-nowrap">
                      {sizeLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
