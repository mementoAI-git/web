import { Home } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useChatSidebar } from "@/contexts/chat-sidebar";
import { cn } from "@/utility";

const SIDE_MODALS = ["create-memory", "view-memory"];

export type FloatingChatButtonVariant = "floating" | "header";

interface FloatingChatButtonProps {
  /** `header`: inline control for the dashboard top bar (8px gap from siblings via parent `gap-2`). */
  variant?: FloatingChatButtonVariant;
}

/**
 * Chat sidebar toggle — floating FAB or compact header control.
 */
export function FloatingChatButton({ variant = "floating" }: FloatingChatButtonProps) {
  const { state } = useModal();
  const { chatOpen, setChatOpen } = useChatSidebar();
  const isSideModalOpen = state?.some((m) => SIDE_MODALS.includes(m.name));

  const isFloating = variant === "floating";
  const positionClasses = isFloating
    ? isSideModalOpen
      ? "left-[6px] bottom-[6px]"
      : chatOpen
        ? "right-4 bottom-4 md:right-[331px]"
        : "right-4 bottom-4"
    : null;

  const button = (
    <button
      type="button"
      onClick={() => setChatOpen(!chatOpen)}
      className={cn(
        "flex shrink-0 cursor-pointer items-center justify-center transition-colors",
        isFloating
          ? [
              "size-10 min-h-10 min-w-10 rounded-full shadow-md",
              chatOpen
                ? "bg-gradient-to-br from-[#FF8944] to-[#FF3CDF] hover:opacity-90"
                : "border border-black/10 bg-white hover:bg-v3-fill-weaker",
            ]
          : [
              "size-9 rounded-xl border border-v3-stroke-weak bg-v3-fill-weaker text-v3-icon-neutral",
              "hover:bg-v3-fill-weak hover:text-v3-text-strong",
              chatOpen &&
                "border-transparent bg-gradient-to-br from-[#FF8944] to-[#FF3CDF] hover:opacity-90",
            ],
      )}
      aria-label={chatOpen ? "Close chat" : "Open chat"}
      aria-pressed={chatOpen}
    >
      <Home
        className={cn(
          isFloating ? "size-5" : "size-[18px]",
          chatOpen ? "text-white" : "text-current opacity-80",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );

  if (!isFloating) {
    return button;
  }

  return (
    <div
      className={cn(
        "absolute z-9999 animate-fade-in-up transition-all",
        positionClasses,
      )}
    >
      {button}
    </div>
  );
}
