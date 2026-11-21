import { useState } from "react";
import { createPortal } from "react-dom";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { mutate } from "swr";
import Spinner from "@/components/spinner";
import { Download, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import DeleteMemoryAttachment from "./delete-attachment";
import type { FilePreviewItemBase } from "./index";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * The viewer's file actions. "viewer": icon buttons beside the viewer's close.
 * "page": labelled Download and Delete for a full page (it has its own close),
 * confirming in a dialog that sits above the page.
 */
export default function ActionBtn({ variant = "viewer", ...props }: FilePreviewItemBase & { variant?: "viewer" | "page" }) {
  const { close } = useModal();
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { trigger: deleteFile, isMutating } = useFetcher(
    props._id ? `${endpoint.removeFileFromMemory}/${props._id}` : null,
    "delete",
  );

  // File links are signed and expire; download from the current link, and get a
  // fresh one if the server turns the old one down.
  const { src, onError: refreshLink } = useSignedMediaAccess(props);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const get = (url: string) => fetch(url, { mode: "cors" }).catch(() => null);
      let response = await get(src);
      if (!response?.ok) {
        const fresh = await refreshLink();
        if (fresh.url && fresh.url !== src) response = await get(fresh.url);
      }
      if (!response?.ok) throw new Error(`Download failed (${response?.status ?? "network error"})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = props.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file", error);
      toast.error("Couldn’t download this file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!props._id) return;
    try {
      const result = await deleteFile({});
      if (result?.data?._id) {
        await mutate(`${endpoint.memories}/${result.data._id}`);
      }
      props.onDelete(props._id);
    } catch (error) {
      console.error("Failed to delete file", error);
      toast.error("Couldn’t delete this file. Please try again.");
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  if (variant === "page") {
    const canDelete = Boolean(props._id && !props.readOnly);
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
          aria-busy={downloading}
          className="transcript-quiet-fill h-11 gap-2 rounded-full border-transparent bg-fill-neutral-weak px-5 font-geist text-sm font-semibold text-text-neutral-strong hover:bg-fill-neutral-weaker"
        >
          {downloading ? <Spinner loading className="!m-0 !text-text-neutral-weaker" /> : <Download className="size-4" aria-hidden />}
          Download
        </Button>
        {canDelete ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteConfirmation(true)}
            className="transcript-quiet-fill h-11 gap-2 rounded-full border-transparent bg-fill-neutral-weak px-5 font-geist text-sm font-semibold text-text-error-strong hover:bg-fill-error-weak"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
        ) : null}
        <AlertDialog open={showDeleteConfirmation} onOpenChange={(open) => !isMutating && setShowDeleteConfirmation(open)}>
          {/* The page sits at z-110, so confirm above it. */}
          <AlertDialogContent className="z-[130]" overlayClassName="z-[125]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this recording?</AlertDialogTitle>
              <AlertDialogDescription>It’s removed from the story for good. This can’t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>Keep it</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isMutating}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {isMutating ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1 sm:gap-3">
      {props._id && showDeleteConfirmation &&
        createPortal(
          <DeleteMemoryAttachment
            loading={isMutating}
            open={showDeleteConfirmation}
            close={() => setShowDeleteConfirmation(false)}
            onDelete={handleDelete}
          />,
          document.body,
        )}
      {props._id && !props.readOnly && (
        <button
          type="button"
          className="overlay-control overlay-control-destructive flex size-10 items-center justify-center rounded-full text-text-error-strong"
          onClick={() => setShowDeleteConfirmation(true)}
          aria-label="Delete file"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      )}
      <button
        type="button"
        className="overlay-control flex size-10 items-center justify-center rounded-full text-text-neutral-strong disabled:opacity-50"
        onClick={handleDownload}
        disabled={downloading}
        aria-busy={downloading}
        aria-label="Download file"
      >
        {downloading ? <Spinner loading className="!m-0 !text-text-neutral-weaker" /> : <Download className="size-5" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={() => close?.("file-preview")}
        className="overlay-control flex size-10 items-center justify-center rounded-full text-text-neutral-strong"
        aria-label="Close viewer"
        data-viewer-close
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
