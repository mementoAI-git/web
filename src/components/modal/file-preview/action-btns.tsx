import { useState } from "react";
import { createPortal } from "react-dom";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { mutate } from "swr";
import Spinner from "@/components/spinner";
import { Download, Trash2, X } from "lucide-react";
import DeleteMemoryAttachment from "./delete-attachment";
import type { FilePreviewItemBase } from "./index";

export default function ActionBtn(props: FilePreviewItemBase) {
  const { close } = useModal();
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { trigger: deleteFile, isMutating } = useFetcher(
    props._id ? `${endpoint.removeFileFromMemory}/${props._id}` : null,
    "delete",
  );

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(props.url, { mode: "cors" });
      if (!response.ok) throw new Error("Network response was not ok");
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
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

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
      {props._id && (
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full text-text-error-strong transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
          onClick={() => setShowDeleteConfirmation(true)}
          aria-label="Delete file"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
      )}
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full text-text-neutral-strong transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak disabled:opacity-50"
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Download file"
      >
        {downloading ? <Spinner loading className="!m-0 !text-text-neutral-weaker" /> : <Download className="size-5" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={() => close?.("file-preview")}
        className="flex size-10 items-center justify-center rounded-full text-text-neutral-strong transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-weak"
        aria-label="Close viewer"
        data-viewer-close
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
