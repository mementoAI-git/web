import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { deleteFetcher, fileUploadFetcher } from "@/api/fetcher";
import { concatStrings } from "@/utility";
import type { IFile, IOnUploadPayload } from "@/utility/interface";

export default function useFileUpload({ retainFailures = false }: { retainFailures?: boolean } = {}) {
  const [files, setFiles] = useState<IOnUploadPayload[]>([]);
  const mounted = useRef(true);
  const inFlight = useRef(new Set<string>());
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /** Resolves with the uploaded file, or undefined when the upload didn't finish. */
  const handleUpload = async (file: IOnUploadPayload, retry = false): Promise<IFile | undefined> => {
    // FileReader callbacks can finish after preview has been switched off and
    // this screen remounted. They must not upload into the normal account.
    if (!mounted.current) return;
    if (!file.file) {
      toast.error("No file to upload");
      return;
    }
    if (inFlight.current.has(file.id)) return;
    inFlight.current.add(file.id);

    setFiles((prev) => retry ? prev.map((item) => item.id === file.id ? { ...item, progress: 0, uploadFailed: false } : item) : [...prev, file]);
    const markFailed = () => {
      if (!mounted.current) return;
      setFiles((prev) => retainFailures ? prev.map((item) => item.id === file.id ? { ...item, uploadFailed: true } : item) : prev.filter((item) => item.id !== file.id));
    };

    const payload = {
      file: file.file,
      onProgress: (progress: number) => {
        if (!mounted.current) return;
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress } : f)),
        );
      },
      ...(file.duration !== undefined && { duration: file.duration }),
    };

    try {
      const result = await fileUploadFetcher(endpoint.upload, { arg: payload });
      if (!mounted.current) return;

      const uploadedFile = Array.isArray(result?.data)
        ? result?.data[0]
        : result?.data;

      if (!uploadedFile?._id || result?.success === false) {
        if (!("subscriptionGate" in result && result.subscriptionGate) && (!retainFailures || result.success !== false || !result.message)) {
          toast.error(typeof result?.message === "string" ? result.message : "Upload unsuccessful");
        }
        markFailed();
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, uploadedFile, progress: 100, ...(retainFailures ? { uploadFailed: false } : {}) } : f,
          ),
        );
        return uploadedFile;
      }
    } catch {
      if (mounted.current) toast.error(retainFailures ? "Couldn’t upload the file. Retry when you’re connected." : "Couldn’t upload the file. Try again.");
      markFailed();
    } finally {
      inFlight.current.delete(file.id);
    }
  };

  const handleDeleteFile = async ({ id, uploadedFile }: IOnUploadPayload) => {
    if (!mounted.current) return;
    if (!uploadedFile?.name) return;
    await deleteFetcher(concatStrings(endpoint.files, uploadedFile.name, "/"));

    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    files: useMemo(() => files, [files]),
    handleUpload,
    retryUpload: (file: IOnUploadPayload) => handleUpload(file, true),
    handleDeleteFile,
    setFiles,
  };
}
