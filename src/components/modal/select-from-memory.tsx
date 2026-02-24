import endpoint from "@/api/endpoint";
import { Checkbox, Searchinput } from "@/components/Form";
import { ModalCloseBtn } from "./modalLayout";
import { isEmpty, cn } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { SearchIcon } from "../icons";
import dayjs from "dayjs";

interface SelectFromMemoryProps {
  selectedIds?: string[];
  handleClose: () => void;
  onConfirm: (items: IMemory[]) => void;
  className?: string;
  hideHeader?: boolean;
}

// Strip HTML tags for text preview
const stripHtml = (html?: string): string => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Type icons for memory types
const StoryIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ConversationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function SelectFromMemory({
  selectedIds = [],
  onConfirm,
  handleClose,
  className = "modal-container h-[600px]",
  hideHeader = false,
}: SelectFromMemoryProps) {
  const [page] = useState(1);
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);
  const { data, isLoading } = useSWR(`${endpoint.memories}?page=${page}`);

  useEffect(() => {
    console.log(data);
  }, [data, isLoading]);

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

  const getMemoryPreview = (memory: IMemory) => {
    if (memory.type === "story") {
      return {
        title: memory.title || "Untitled Story",
        subtitle: stripHtml(memory.body) || "No content",
        icon: <StoryIcon />,
        iconBg: "from-orange-100 to-orange-50 text-orange-500",
      };
    }

    // Conversation type
    return {
      title: memory.title || memory.prompt || "Untitled Conversation",
      subtitle: memory.summary || "AI-guided conversation",
      icon: <ConversationIcon />,
      iconBg: "from-blue-100 to-blue-50 text-blue-500",
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

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <ul className="space-y-2 gap-1 grid grid-cols-2 lg:grid-cols-5">
          {!isLoading && isEmpty(data?.data?.docs) ? (
            <div className="text-center py-10 text-gray-500">
              You have no Memories
            </div>
          ) : (
            data?.data?.docs?.map((memory: IMemory) => {
              const preview = getMemoryPreview(memory);

              return (
                <li
                  key={memory._id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                  onClick={() => handleCheck(memory)}
                >
                  <Checkbox
                    checked={localSelectedIds.includes(memory._id)}
                    onChange={() => handleCheck(memory)}
                    className="pointer-events-none"
                  />

                  <div
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      preview.iconBg,
                    )}
                  >
                    {preview.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {preview.title}
                    </h5>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {preview.subtitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                        {memory.type}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {dayjs(memory.created_at).format("MMM D, YYYY")}
                      </span>
                      {memory.topics && memory.topics.length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[100px]">
                          • {memory.topics.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
          {isLoading && <div className="text-center py-10">Loading...</div>}
        </ul>
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
