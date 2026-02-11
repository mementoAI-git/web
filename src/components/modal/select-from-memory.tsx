import endpoint from "@/api/endpoint";
import { Checkbox, Searchinput } from "@/components/Form";
import { ModalCloseBtn } from "./modalLayout";
import { isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";
import { SearchIcon } from "../icons";
import ImageThumbnail from "@/components/image-thumbnail";
import dayjs from "dayjs";

interface SelectFromMemoryProps {
  selectedIds?: string[];
  handleClose: () => void;
  onConfirm: (items: IMemory[]) => void;
}

export default function SelectFromMemory({
  selectedIds = [],
  onConfirm,
  handleClose,
}: SelectFromMemoryProps) {
  const [page] = useState(1);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);
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
    // Find objects for the selected IDs from the current data
    // Note: This limits selection to currently visible items. 
    // In a real paginated scenario, we'd need to track selected objects, not just IDs.
    const selectedItems = data?.data?.docs?.filter((m: IMemory) => 
      localSelectedIds.includes(m._id)
    ) || [];
    
    onConfirm(selectedItems);
    handleClose();
  };

  return (
    <div className="modal-container h-[600px] flex flex-col">
      <div className="flex-shrink-0">
        <ModalCloseBtn onClick={handleClose} />
        <div className="space-y-1 mb-6">
          <h4 className="modal-title">Select item from memory</h4>
          <p className="font-inter text-sm text-grey-600">
            Share an entry from memory as a time capsule
          </p>
        </div>

        <div className="mb-6">
          <div className="w-full relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 sm:hidden">
              <SearchIcon />
            </div>
            <div className="w-full">
               <Searchinput className="bg-white border-gray-200 w-full" placeholder="Search memories..." />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <ul className="space-y-2">
          {!isLoading && isEmpty(data?.data?.docs) ? (
            <div className="text-center py-10 text-gray-500">You have no Memories</div>
          ) : (
            data?.data?.docs?.map((memory: IMemory) => (
              <li
                key={memory._id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                onClick={() => handleCheck(memory)}
              >
                 <Checkbox
                  checked={localSelectedIds.includes(memory._id)}
                  onChange={() => handleCheck(memory)}
                  className="pointer-events-none" // Let li click handle it
                />

                <div className="shrink-0">
                  <ImageThumbnail 
                    images={memory.attachments || []} 
                    size={48}
                    boxClassName="rounded-lg"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate">{memory.title || "Untitled Memory"}</h5>
                  <p className="text-xs text-gray-500 line-clamp-1">{memory.body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {dayjs(memory.created_at).format("MMM D, YYYY")}
                  </p>
                </div>
              </li>
            ))
          )}
          {isLoading && (
            <div className="text-center py-10">Loading...</div>
          )}
        </ul>
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
          {localSelectedIds.length === 1 ? "story" : "stories"}
        </button>
      </div>
    </div>
  );
}
