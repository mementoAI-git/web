import { FloatingButton } from "@/components/FloatingButton";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";

const SIDE_MODALS = ["create-memory", "view-memory"];

/**
 * Floating “Need help?” control (opens create-feedback modal).
 * Kept for reuse; mount where you want it in the tree (inside ChatSidebarProvider + ModalProvider).
 */
export function FloatingHelpButton() {
  const { open, state } = useModal();
  const { chatOpen } = useChatSidebar();
  const isSideModalOpen = state?.some((m) => SIDE_MODALS.includes(m.name));

  const positionClasses = isSideModalOpen
    ? "left-[6px] bottom-[6px]"
    : chatOpen
      ? "right-4 bottom-4 md:right-[331px]"
      : "right-4 bottom-4";

  return (
    <div
      className={`absolute text-5xl z-9999 group animate-fade-in-up transition-all ${positionClasses}`}
    >
      <div className="relative">
        <FloatingButton
          type="button"
          aria-label="Drop a feedback"
          onClick={() => open("create-feedback")}
          className="flex size-10 min-w-10 min-h-10 items-center justify-center rounded-full! bg-primary p-0! mt-0! h-10! w-10!"
        >
          <span className="text-lg leading-none select-none" aria-hidden>
            📝
          </span>
        </FloatingButton>

        <div className="absolute text-xs right-full top-1/2 -translate-x-1 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded shadow whitespace-nowrap">
          Drop a feedback
        </div>
      </div>
    </div>
  );
}
