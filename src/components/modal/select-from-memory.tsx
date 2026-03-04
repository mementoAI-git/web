import endpoint from "@/api/endpoint";
import { Checkbox, Searchinput } from "@/components/Form";
import { ModalCloseBtn } from "./modalLayout";
import { isEmpty, cn } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { SearchIcon } from "../icons";
import dayjs from "dayjs";
import MediaCard from "@/pages/dashboard/time-capsule-new/components/media-cards/MediaCard";
import type { CardCustomization } from "@/pages/dashboard/time-capsule-new/components/CapsulePreviewCard";

interface SelectFromMemoryProps {
  selectedIds?: string[];
  handleClose: () => void;
  onConfirm: (items: IMemory[]) => void;
  className?: string;
  hideHeader?: boolean;
}

// Default style for cards in selection modal
const DEFAULT_CARD_STYLE: CardCustomization = {
  backgroundColor: "#F8F7F3",
  fontFamily: "Inter",
  fontSize: "1x",
  textColor: "#1A1A1A",
};

export default function SelectFromMemory({
  selectedIds = [],
  onConfirm,
  handleClose,
  className = "modal-container sm:max-w-4xl lg:max-w-7xl xl:max-w-8xl h-[600px]",
  hideHeader = false,
}: SelectFromMemoryProps) {
  const [page] = useState(1);
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);
  const { data, isLoading } = useSWR(`${endpoint.memories}?page=${page}`);

  const handleCheck = (memory: IMemory) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(memory._id)) {
        return prev.filter((id) => id !== memory._id);
      }
      return [...prev, memory._id];
    });
  };

  const handleAdd = () => {
    const selectedItems =
      data?.data?.docs?.filter((m: IMemory) =>
        localSelectedIds.includes(m._id),
      ) || [];

    onConfirm(selectedItems);
    handleClose();
  };

  const mapMemoryToMediaCardProps = (memory: IMemory) => {
    const attachment = memory.attachments?.[0];
    const mimeType = attachment?.type || "";

    let type: "audio" | "video" | "image" | "memory" | "pdf" = "memory";

    if (mimeType.startsWith("image/")) type = "image";
    else if (mimeType.startsWith("video/")) type = "video";
    else if (mimeType.startsWith("audio/")) type = "audio";
    else if (mimeType === "application/pdf") type = "pdf";

    return {
      type,
      title: memory.title || "Untitled",
      src: attachment?.url,
      duration: attachment?.duration
        ? `${Math.floor(attachment.duration / 60)}:${String(Math.floor(attachment.duration % 60)).padStart(2, "0")}`
        : undefined,
    };
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="shrink-0">
        {!hideHeader && (
          <>
            <ModalCloseBtn onClick={handleClose} />
            <div className="space-y-1 mb-6">
              <h4 className="modal-title">Select item from memory</h4>
              <p className="font-inter text-sm text-grey-600">
                Share an entry from memory as a time capsule
              </p>
            </div>
          </>
        )}

        <div className="mb-6">
          <div className="w-full relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 sm:hidden">
              <SearchIcon />
            </div>
            <div className="w-full">
              <Searchinput
                className="bg-white border-gray-200 w-full"
                placeholder="Search memories..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {!isLoading && isEmpty(data?.data?.docs) ? (
            <div className="col-span-full text-center py-10 text-gray-500">
              You have no Memories
            </div>
          ) : (
            data?.data?.docs?.map((memory: IMemory) => {
              const cardProps = mapMemoryToMediaCardProps(memory);
              const isSelected = localSelectedIds.includes(memory._id);

              return (
                <div key={memory._id} className="relative group">
                  <MediaCard
                    {...cardProps}
                    style={DEFAULT_CARD_STYLE}
                    onClick={() => handleCheck(memory)}
                    className={cn(
                      "transition-all duration-300 flex flex-col justify-between rounded-sm overflow-hidden h-full w-full",
                      isSelected
                        ? "scale95 opacity-90 border border-green-0"
                        : "hover:scale[1.02]",
                    )}
                  />

                  {/* Selection Indicator */}
                  {/* <div
                    className={cn(
                      "absolute top-2 right-2 z-20 transition-opacity duration-200",
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleCheck(memory)}
                      className="scale-110 shadow-lg"
                    />
                  </div> */}

                  {/* Date Tag */}
                  {/* <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className="text-[9px] bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-gray-500 shadow-sm border border-gray-100">
                      {dayjs(memory.created_at).format("MMM D")}
                    </span>
                  </div> */}
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="col-span-full text-center py-10">Loading...</div>
          )}
        </div>
      </div>

      <div className="shrink-0 pt-4 mt-auto border-t border-gray-100 flex justify-end gap-3">
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
          {localSelectedIds.length === 1 ? "item" : "items"}
        </button>
      </div>
    </div>
  );
}
