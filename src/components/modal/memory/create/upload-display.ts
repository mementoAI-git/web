import { inferMimeType } from "@/utility/constant";
import type { IOnUploadPayload } from "@/utility/interface";

export type UploadDisplayKind = "document" | "media";

export function resolveUploadMimeType(file: IOnUploadPayload): string {
  const rawType = file.file?.type || file.uploadedFile?.type || "";
  return rawType || inferMimeType(file.file?.name ?? file.uploadedFile?.name ?? file.uploadedFile?.url);
}

export function getUploadDisplayKind(mimeType: string): UploadDisplayKind {
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "text/plain"
  ) {
    return "document";
  }

  return "media";
}
