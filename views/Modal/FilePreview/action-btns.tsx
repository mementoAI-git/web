import TimesIcon from "@/public/icon/times.svg";
import DownloadIcon from "@/public/icon/download.svg";
import { useModal } from "@/hooks/use-modal";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { mutate } from "swr";
import { IFilePreviewItem } from ".";
import { DeleteMemoryAttachment } from "./delete-attachment";
import { useState } from "react";

export default function ActionBtn(props: IFilePreviewItem) {
  const { close } = useModal();
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false)
  const { trigger: deleteFile, isMutating } = useFetcher(`${endpoint.removeFileFromMemory}/${props._id}`, "delete");

  const handleDownload = async () => {
    try {
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
      alert("Failed to download file.");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    try {
      const result = await deleteFile();
      await mutate(`${endpoint.memories}/${result?.data?._id}`)
      props.onDelete(props._id)
    } catch (error) {
      alert("Failed to delete file.");
    }
  };

  return (
    <div className="w-full mb-6 flex justify-end items-stretch gap-3">
      {
        props._id &&
        openDeleteConfirmation &&
        <DeleteMemoryAttachment
          onDelete={handleDelete}
          loading={isMutating}
          open={openDeleteConfirmation}
          close={() => setOpenDeleteConfirmation(false)}
        />
      }
      <div
        className="bg-[#F3F3F3] rounded-full flex items-center cursor-pointer justify-center gap-2 py-[9px] px-4 text-sm w-fit font-geist text-danger font-medium"
        onClick={() => setOpenDeleteConfirmation(true)}
      >
        <TimesIcon width={10} height={10} />
        <span>Delete</span>
      </div>
      {/* <div className="bg-[#F3F3F3] rounded-full flex items-center cursor-pointer justify-center gap-2 py-[9px] px-4 text-sm w-fit font-geist text-[#98A2B3] font-medium">
        <CopyIcon width={16} height={16} />
        <span className="text-black">Copy</span>
      </div> */}
      <div
        className="bg-[#F3F3F3] rounded-full flex items-center cursor-pointer justify-center gap-2 py-[9px] px-4 text-sm w-fit font-geist text-[#98A2B3] font-medium"
        onClick={handleDownload}
      >
        <DownloadIcon width={16} height={16} />
        <span className="text-black">Download</span>
      </div>
      <div
        onClick={() => close("file-preview")}
        className="bg-white/15 size-10 rounded-full flex items-center cursor-pointer justify-center text-white"
      >
        <TimesIcon width={10} height={10} />
      </div>
    </div>
  );
}