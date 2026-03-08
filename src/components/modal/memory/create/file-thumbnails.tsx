"use client";

import { TimesIcon } from "@/components/icons";
import type { IOnUploadPayload } from "@/utility/interface";

import imageUploadSvg from "@/assets/icon/Image Upload.svg";
import recUploadSvg from "@/assets/icon/rec upload - short.svg";
import videoUploadSvg from "@/assets/icon/Video Upload.svg";
import docUploadSvg from "@/assets/icon/Document Upload.svg";
import musicUploadSvg from "@/assets/icon/music upload - short.svg";

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
          const mimeType = f.file?.type || f.uploadedFile?.type || "";
          const thumbSvg = getFileThumbSvg(mimeType);
          const isImage = mimeType.startsWith("image/");
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
                <img
                  src={imgSrc}
                  className="w-full h-full object-cover rounded-xl"
                  alt=""
                />

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
