import { useMemo, useState } from "react";
import useSWRMutation from "swr/mutation";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { deleteFetcher, fileUploadFetcher } from "@/api/fetcher";
import { concatStrings } from "@/utility";
import type { IOnUploadPayload } from "@/utility/interface";

export default function useFileUpload() {
  const [files, setFiles] = useState<IOnUploadPayload[]>([]);
  const { trigger: uploadFile } = useSWRMutation(endpoint.upload, fileUploadFetcher);

  const handleUpload = async (file: IOnUploadPayload) => {
    setFiles((prev) => [...prev, file]);

    const payload = {
      file: file.file,
      onProgress: (progress: number) => {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)));
      },
    };

    const result = await uploadFile(payload as any);

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
    await deleteFetcher(
      concatStrings(endpoint.files, uploadedFile.name, "/")
    );

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    files: useMemo(() => files, [files]),
    handleUpload,
    handleDeleteFile,
    setFiles,
  };
}
