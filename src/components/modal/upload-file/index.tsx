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

      const result = await uploadFile(payload as Parameters<typeof uploadFile>[0]);

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
                  <UploadItem onDelete={handleDeleteFile} file={file} key={file.id} />
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
          <Button type="button" variant="outline" onClick={() => close?.("file-upload")}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddToPost} disabled={files.length === 0 || adding}>
            Add to post
            <Spinner loading={adding} className="!size-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
