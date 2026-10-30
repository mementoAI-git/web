import type { IOnUploadPayload } from "@/utility/interface";

/** Restored files may belong to another draft or a published story. */
export function disposableDraftUploads(
  files: IOnUploadPayload[],
  remainingDrafts: { attachments?: { _id: string }[] }[],
): IOnUploadPayload[] {
  const retainedIds = new Set(remainingDrafts.flatMap((draft) => draft.attachments?.map((file) => file._id) ?? []));
  return files.filter((file) => file.file && file.uploadedFile?._id && !retainedIds.has(file.uploadedFile._id));
}
