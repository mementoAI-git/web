import { useCallback, useEffect, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface FileState {
  file: File | null;
  result?: IFile;
  progress: number;
  id: string;
  failed?: boolean;
}

interface UploadFilesProps {
  data?: string;
}

export default function UploadFiles({ data: id }: UploadFilesProps) {
  const { close, registerCloseGuard } = useModal();
  const [files, setFiles] = useState<FileState[]>([]);
  const [attaching, setAttaching] = useState(false);
  const attachingRef = useRef(false);
  const mounted = useRef(true);
  const inFlight = useRef(new Set<string>());
  const removed = useRef(new Set<string>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const { trigger: uploadFile } = useFileUploadFetcher();
  const { trigger: addToPost, isMutating: adding } = useFetcher(id ? `${endpoint.memories}/${id}` : null, "put");

  const persistAttachments = useCallback(
    (nextFiles: FileState[]) => {
      if (isEmpty(id)) {
        localStorage.setItem(storageKeys.attachments, JSON.stringify({ files: nextFiles.filter((file) => file.result?._id && !file.failed).map((file) => ({ ...file, file: null })) }));
      }
    },
    [id],
  );

  const handleDeleteFile = useCallback(
    async (file: FileState) => {
      if (attachingRef.current) return;
      try {
        if (file?.result?.name) {
          const result = await deleteFetcher(resolvePath(endpoint.files, { id: file.result.name }), { arg: {} });
          if (result.success === false) return;
        }
        removed.current.add(file.id);
        const next = filesRef.current.filter((item) => item.id !== file.id);
        setFiles(next);
        persistAttachments(next);
      } catch {
        toast.error("Couldn’t remove the file. Please try again.");
      }
    },
    [persistAttachments],
  );

  const handleAddToPost = useCallback(async () => {
    if (attachingRef.current || adding || !files.length || files.some((file) => !file.result?._id || file.failed)) return;
    attachingRef.current = true;
    setAttaching(true);
    const attachments = files
      .map((file) => file.result?._id)
      .filter((value): value is string => Boolean(value));

    try {
      if (isEmpty(id)) {
        persistAttachments(files);
      } else {
        const result = await addToPost({ attachments });
        if (!result || result.success === false) {
          toast.error(result?.message || "Couldn’t attach your files. Please try again.");
          return;
        }
        void mutate(endpoint.memories);
      }
      setFiles([]);
      attachingRef.current = false;
      close?.("file-upload");
    } catch {
      toast.error("Couldn’t attach your files. Please try again.");
    } finally {
      attachingRef.current = false;
      if (mounted.current) setAttaching(false);
    }
  }, [adding, addToPost, close, files, id, persistAttachments]);

  const upload = useCallback(
    async (file: FileState) => {
      if (!file.file || inFlight.current.has(file.id)) return;
      inFlight.current.add(file.id);
      setFiles((previous) => previous.map((item) => item.id === file.id ? { ...item, failed: false, progress: 0 } : item));

      const payload = {
        file: file.file,
        onProgress: (progress: number) => {
          if (!mounted.current || removed.current.has(file.id)) return;
          setFiles((previous) =>
            previous.map((item) => (item.id === file.id ? { ...item, progress } : item)),
          );
        },
      };

      try {
        const result = await uploadFile(payload as Parameters<typeof uploadFile>[0]);
        const uploadedFile = (Array.isArray(result?.data) ? result.data[0] : result?.data) as IFile | undefined;
        if (!mounted.current || removed.current.has(file.id)) return;
        if (result?.success === false || !uploadedFile?._id) {
          // The shared uploader already toasts API failures and subscription gates.
          if (result?.success !== false || !result?.message) toast.error("Upload unsuccessful. Retry or remove the file.");
          setFiles((previous) => previous.map((item) => item.id === file.id ? { ...item, failed: true } : item));
          return;
        }
        setFiles((previous) => previous.map((item) => item.id === file.id ? { ...item, result: uploadedFile, progress: 100, failed: false } : item));
      } catch {
        if (!mounted.current || removed.current.has(file.id)) return;
        toast.error("Couldn’t upload the file. Retry when you’re connected.");
        setFiles((previous) => previous.map((item) => item.id === file.id ? { ...item, failed: true } : item));
      } finally {
        inFlight.current.delete(file.id);
      }
    },
    [uploadFile],
  );

  const handleOnUpload = useCallback(async (file: FileState) => {
    if (attachingRef.current) return;
    setFiles((previous) => [...previous, file]);
    await upload(file);
  }, [upload]);

  useEffect(() => {
    mounted.current = true;
    if (!id) {
      try {
        const parsed = JSON.parse(localStorage.getItem(storageKeys.attachments) ?? "null") as { files?: FileState[] } | null;
        if (Array.isArray(parsed?.files)) setFiles(parsed.files.filter((file) => file?.result?._id && !file.failed).map((file) => ({ ...file, file: null, progress: 100 })));
      } catch {
        // Old or unavailable storage must not prevent a fresh upload.
      }
    }
    return () => { mounted.current = false; };
  }, [id]);

  useEffect(() => registerCloseGuard?.("file-upload", () => !attachingRef.current), [registerCloseGuard]);

  const busy = adding || attaching;
  const canAttach = files.length > 0 && files.every((file) => Boolean(file.result?._id) && !file.failed);

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("file-upload")} />
      <Card className="gap-0 border border-border/70 bg-background/95 py-0 shadow-xl backdrop-blur-sm">
        <CardHeader className="gap-3 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-inter text-xl text-foreground sm:text-2xl">
                Upload files
              </CardTitle>
              <CardDescription className="max-w-[36rem] font-inter text-sm leading-6">
                Add photos, videos, voice notes, and documents. Uploaded files stay here until you attach them to the story.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0">
              {files.length} {files.length === 1 ? "item" : "items"}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex max-h-[72vh] min-h-[420px] flex-col gap-5 px-5 py-5 sm:px-6">
          <UploadInput onUpload={handleOnUpload} />

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-inter text-sm font-medium text-foreground">Uploads</p>
              <p className="font-inter text-xs text-muted-foreground">
                {files.length === 0 ? "No files added yet" : "Review uploads before attaching them"}
              </p>
            </div>

            {files.length > 0 ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {files.map((file) => (
                  <UploadItem onDelete={handleDeleteFile} onRetry={upload} disabled={busy} file={file} key={file.id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                <div className="flex max-w-sm flex-col gap-2">
                  <p className="font-inter text-sm font-medium text-foreground">
                    Nothing uploaded yet
                  </p>
                  <p className="font-inter text-sm leading-6 text-muted-foreground">
                    Drop a file into the upload area or browse from your device to start building the post.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="justify-end gap-3 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" disabled={busy} onClick={() => close?.("file-upload")}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddToPost} disabled={!canAttach || busy}>
            Add to post
            <Spinner loading={busy} className="!size-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
