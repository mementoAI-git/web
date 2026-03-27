import { Home } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { cn } from "@/utility";

const SIDE_MODALS = ["create-memory", "view-memory"];

/**
 * Floating chat toggle (same corner behavior as the old help FAB).
 */
export function FloatingChatButton() {
  const { state } = useModal();
  const { chatOpen, setChatOpen } = useChatSidebar();
  const isSideModalOpen = state?.some((m) => SIDE_MODALS.includes(m.name));

  const positionClasses = isSideModalOpen
    ? "left-[6px] bottom-[6px]"
    : chatOpen
      ? "right-4 bottom-4 md:right-[331px]"
      : "right-4 bottom-4";

  return (
    <div
      className={cn(
        "absolute z-9999 animate-fade-in-up transition-all",
        positionClasses,
      )}
    >
      <button
        type="button"
        onClick={() => setChatOpen(!chatOpen)}
        className={cn(
          "flex size-10 min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-full shadow-md transition-colors",
          chatOpen
            ? "bg-gradient-to-br from-[#FF8944] to-[#FF3CDF] hover:opacity-90"
            : "border border-black/10 bg-white hover:bg-v3-fill-weaker",
        )}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
        aria-pressed={chatOpen}
      >
        <Home
          className={cn("size-5", chatOpen ? "text-white" : "text-v3-icon-neutral opacity-80")}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
    </div>
  );
}
