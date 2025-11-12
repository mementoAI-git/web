import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { deleteFetcher, fileUploadFetcher } from "@/api/fetcher";
import { resolvePath } from "@/utility";
import type { IOnUploadPayload } from "@/utility/interface";

export default function useFileUpload() {
  const [files, setFiles] = useState<IOnUploadPayload[]>([]);
  const { trigger: uploadFile } = useSWRMutation(endpoint.upload, fileUploadFetcher);

  const handleUpload = async (file: IOnUploadPayload) => {
    setFiles((prev) => [...prev, file]);

    const result = await uploadFile({
      file: file.file,
      onProgress: (progress: number) => {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)));
      },
    });

    if (!result?.data?.[0]) {
      toast.error("Upload unsuccessful");
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, uploadedFile: result.data[0] } : f)),
      );
    }
  };

  const handleDeleteFile = async ({ id, uploadedFile }: IOnUploadPayload) => {
    if (!uploadedFile?.name) return;
    await deleteFetcher(resolvePath(endpoint.files, { id: uploadedFile.name }), { arg: {} });

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    files: useMemo(() => files, [files]),
    handleUpload,
    handleDeleteFile,
    setFiles,
  };
}
