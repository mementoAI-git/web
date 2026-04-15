import { Info } from "lucide-react";
import { cn } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { type IMemory } from "@/utility/interface";

interface IMemoryDropdownProps {
  memory: IMemory;
  /** Opens the right-hand memory panel (sidebar). */
  onViewDetails?: () => void;
  /** @deprecated Actions moved into the sidebar panel; kept for API compatibility. */
  onExportConversation?: () => void;
  /** Passed to the trigger button (e.g. v3 header chips). */
  triggerClassName?: string;
}

/**
 * Opens the conversation memory sidebar directly. Menu actions (view modal, edit, export, delete) live in {@link SidebarDetails} when `quickActions` is passed there.
 */
export function MemoryDropdown({
  memory,
  onViewDetails,
  onExportConversation: _onExportConversation,
  triggerClassName,
}: IMemoryDropdownProps) {
  const { push } = useModal();

  const handleOpenPanel = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    push("view-memory-details", { memory });
  };

  return (
    <button
      type="button"
      onClick={handleOpenPanel}
      className={
        triggerClassName ??
        cn(
          "flex aspect-square size-7 shrink-0 items-center justify-center rounded-lg p-2 sm:size-8",
          "bg-transparent text-icon-neutral transition-colors hover:bg-fill-neutral-weaker hover:text-text-neutral-strong",
        )
      }
      aria-label="Open memory sidebar"
    >
      <Info className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
