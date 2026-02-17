import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import UploadInput from "./upload-input";
import UploadItem from "./upload-item";
import type { IFile } from "@/utility/interface";
import endpoint from "@/api/endpoint";
import { deleteFetcher } from "@/api/fetcher";
import useFetcher, { useFileUploadFetcher } from "@/hooks/use-fetcher";
import Spinner from "@/components/spinner";
import { useModal } from "@/hooks/use-modal";
import { ModalCloseBtn } from "../modalLayout";
import { storageKeys } from "@/utility/constant";
import { isEmpty, resolvePath } from "@/utility";
import { mutate } from "swr";

export interface FileState {
  file: File;
  result?: IFile;
  progress: number;
  id: string;
}

interface UploadFilesProps {
  data?: string;
}

export default function UploadFiles({ data: id }: UploadFilesProps) {
  const { close } = useModal();
  const [files, setFiles] = useState<FileState[]>([]);
  const { trigger: uploadFile } = useFileUploadFetcher();
  const { trigger: addToPost, isMutating: adding } = useFetcher(id ? `${endpoint.memories}/${id}` : null, "put");

  const persistAttachments = useCallback(
    (nextFiles: FileState[]) => {
      if (isEmpty(id)) {
        localStorage.setItem(storageKeys.attachments, JSON.stringify({ files: nextFiles }));
      }
    },
    [id],
  );

  const handleDeleteFile = useCallback(
    async (file: FileState) => {
      if (file?.result?.name) {
        await deleteFetcher(resolvePath(endpoint.files, { id: file.result.name }), { arg: {} });
      }

      setFiles((previous) => {
        const next = previous.filter((item) => item.id !== file.id);
        persistAttachments(next);
        return next;
      });
    },
    [persistAttachments],
  );

  const handleAddToPost = useCallback(async () => {
    if (adding) return;
    const attachments = files
      .map((file) => file.result?._id)
      .filter((value): value is string => Boolean(value));

    if (isEmpty(id)) {
      persistAttachments(files);
    } else {
      await addToPost({ attachments });
      mutate(endpoint.memories);
    }

    setFiles([]);
    close?.("file-upload");
  }, [adding, addToPost, close, files, id, persistAttachments]);

  const handleOnUpload = useCallback(
    async (file: FileState) => {
      setFiles((previous) => [...previous, file]);

      const payload = {
        file: file.file,
        onProgress: (progress: number) => {
          setFiles((previous) =>
            previous.map((item) => (item.id === file.id ? { ...item, progress } : item)),
          );
        },
      };

      const result = await uploadFile(payload as any);

      const uploadedFile = Array.isArray(result?.data) ? result?.data[0] : result?.data;
      if (!uploadedFile) {
        toast.error("Upload unsuccessful");
        setFiles((previous) => previous.filter((item) => item.id !== file.id));
        return;
      }

      toast.success(result?.message || "Success");
      setFiles((previous) =>
        previous.map((item) => (item.id === file.id ? { ...item, result: uploadedFile } : item)),
      );
    },
    [uploadFile],
  );

  useEffect(() => {
    const attachments = localStorage.getItem(storageKeys.attachments);
    if (attachments) {
      try {
        const parsed = JSON.parse(attachments) as { files: FileState[] };
        setFiles(parsed.files || []);
      } catch (error) {
        console.error("Failed to parse stored attachments", error);
      }
    }
  }, []);

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("file-upload")} />
      <div className="space-y-4 sm:space-y-6">
        <h4 className="modal-title text-lg sm:text-xl lg:text-2xl">Upload your images or videos</h4>

        <div className="mt-4 flex flex-col sm:mt-6">
          <div className="flex max-h-[500px] min-h-[300px] flex-col gap-4 sm:max-h-[660px] sm:min-h-[425px] sm:gap-6">
            <UploadInput onUpload={handleOnUpload} />

            {files.length > 0 && (
              <div className="flex-1 max-h-[200px] space-y-3 overflow-y-auto sm:max-h-[300px] sm:space-y-4">
                {files.map((file) => (
                  <UploadItem onDelete={handleDeleteFile} file={file} key={file.id} />
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn-outline">
              Discard
            </button>
            <button
              type="button"
              onClick={handleAddToPost}
              disabled={files.length === 0}
              className="btn disabled:cursor-not-allowed disabled:opacity-70"
            >
              Add to post
              <Spinner loading={adding} className="!size-3 sm:!size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

