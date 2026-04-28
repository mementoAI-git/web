import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { deleteFetcher, fileUploadFetcher } from "@/api/fetcher";
import { concatStrings } from "@/utility";
import type { IOnUploadPayload } from "@/utility/interface";

export default function useFileUpload() {
  const [files, setFiles] = useState<IOnUploadPayload[]>([]);
  const { trigger: uploadFile } = useSWRMutation(
    endpoint.upload,
    fileUploadFetcher,
  );

  const handleUpload = async (file: IOnUploadPayload) => {
    if (!file.file) {
      toast.error("No file to upload");
      return;
    }

    setFiles((prev) => [...prev, file]);

    const payload = {
      file: file.file,
      onProgress: (progress: number) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress } : f)),
        );
      },
      ...(file.duration !== undefined && { duration: file.duration }),
    };

    try {
      const result = await uploadFile(payload as Parameters<typeof uploadFile>[0]);

      const uploadedFile = Array.isArray(result?.data)
        ? result?.data[0]
        : result?.data;

      if (!uploadedFile || result?.success === false) {
        toast.error(typeof result?.message === "string" ? result.message : "Upload unsuccessful");
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, uploadedFile, progress: 100 } : f,
          ),
        );
      }
    } catch {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    }
  };

  const handleDeleteFile = async ({ id, uploadedFile }: IOnUploadPayload) => {
    if (!uploadedFile?.name) return;
    await deleteFetcher(concatStrings(endpoint.files, uploadedFile.name, "/"));

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    files: useMemo(() => files, [files]),
    handleUpload,
    handleDeleteFile,
    setFiles,
  };
}
