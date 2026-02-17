import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "./modalLayout";
import { isEmpty, cn } from "@/utility";
import type { IFile } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";
import { Searchinput } from "@/components/Form";
import { PlayIcon, QIcon } from "@/components/icons";

interface SelectFromMediaProps {
  selectedIds?: string[];
  handleClose: () => void;
  onConfirm: (items: IFile[]) => void;
}

function MediaItem({
  file,
  isSelected,
  onToggle,
}: {
  file: IFile;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isImage = file.type.includes("image");
  const isVideo = file.type.includes("video");

  return (
    <div
      onClick={onToggle}
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden cursor-pointer group border transition-all",
        isSelected
          ? "border-green-0 ring ring-green-0 ring-offset1"
          : "border-black/5 hover:border-gray-300",
      )}
    >
      {isImage ? (
        <img
          src={file.url}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          {isVideo ? (
            <PlayIcon width={32} height={32} />
          ) : (
            <QIcon width={32} height={32} />
          )}
        </div>
      )}

      {/* Selection Indicator Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-orange/10 flex items-start justify-end p-2">
          <div className="w-5 h-5 rounded-full bg-orange text-white flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M10 3L4.5 8.5L2 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SelectFromMedia({
  selectedIds = [],
  onConfirm,
  handleClose,
}: SelectFromMediaProps) {
  const [page] = useState(1);
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);
  const { data, isLoading } = useSWR(`${endpoint.files}?page=${page}`);

  const handleToggle = (file: IFile) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(file._id)) {
        return prev.filter((id) => id !== file._id);
      }
      return [...prev, file._id];
    });
  };

  const handleAdd = () => {
    const selectedItems =
      data?.data?.docs?.filter((f: IFile) =>
        localSelectedIds.includes(f._id),
      ) || [];

    onConfirm(selectedItems);
    handleClose();
  };

  return (
    <div className="modal-container h-[600px] flex flex-col">
      <div className="flex-shrink-0">
        <ModalCloseBtn onClick={handleClose} />
        <div className="space-y-1 mb-6">
          <h4 className="modal-title">Select from media</h4>
          <p className="font-inter text-sm text-grey-600">
            Add media files from your library
          </p>
        </div>

        <div className="mb-6">
          <div className="w-full relative">
            {/* Using Searchinput directly from components/Form based on previous file */}
            <Searchinput
              className="bg-white border-gray-200 w-full"
              placeholder="Search media..."
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {!isLoading && isEmpty(data?.data?.docs) ? (
          <div className="text-center py-10 text-gray-500">
            You have no Media files
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {data?.data?.docs?.map((file: IFile) => (
              <MediaItem
                key={file._id}
                file={file}
                isSelected={localSelectedIds.includes(file._id)}
                onToggle={() => handleToggle(file)}
              />
            ))}
          </div>
        )}
        {isLoading && <div className="text-center py-10">Loading...</div>}
      </div>

      <div className="flex-shrink-0 pt-4 mt-auto border-t border-gray-100 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="btn-outline text-sm px-4 py-2"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAdd}
          className="btn text-sm px-6 py-2"
          disabled={localSelectedIds.length === 0}
        >
          Add {localSelectedIds.length > 0 ? `${localSelectedIds.length} ` : ""}
          media
        </button>
      </div>
    </div>
  );
}
