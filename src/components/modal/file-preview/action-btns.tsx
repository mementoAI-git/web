import { useState } from "react";
import { createPortal } from "react-dom";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { mutate } from "swr";
import Spinner from "@/components/spinner";
import { DownloadIcon, TimesIcon } from "@/components/icons";
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
    <div className="flex items-stretch justify-end gap-3">
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
          className="flex items-center gap-2 rounded-full bg-v3-fill-weaker px-4 py-[9px] font-geist text-sm font-medium text-danger"
          onClick={() => setShowDeleteConfirmation(true)}
        >
          <TimesIcon width={10} height={10} />
          <span>Delete</span>
        </button>
      )}
      <button
        type="button"
        className="flex items-center gap-2 rounded-full bg-white px-4 py-[9px] font-geist text-sm font-medium text-v3-text-weaker"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? <Spinner loading className="!m-0 !text-text-neutral-weaker" /> : <DownloadIcon width={16} height={16} />}
        <span className="text-black">Download</span>
      </button>
      <button
        type="button"
        onClick={() => close?.("file-preview")}
        className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <TimesIcon width={10} height={10} />
      </button>
    </div>
  );
}

