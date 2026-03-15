import { Outlet } from "react-router-dom";
import { Agentation } from "agentation";
import { FloatingButton } from "./components/FloatingButton";
import { HelpCircleIcon } from "./components/icons";
import { useModal } from "./hooks/use-modal";
import { ChatSidebarProvider, useChatSidebar } from "./contexts/chat-sidebar";

const SIDE_MODALS = ["create-memory", "view-memory"];

function FloatingHelpButton() {
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
          onClick={() => open("create-feedback")}
          className="flex size-10 min-w-10 min-h-10 items-center justify-center rounded-full! bg-primary p-0! mt-0! h-10! w-10!"
        >
          <HelpCircleIcon className="size-5 text-white" />
        </FloatingButton>

        {/* Tooltip */}
        <div className="absolute text-xs right-full top-1/2 -translate-x-1 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded shadow whitespace-nowrap">
          Need help?
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-secondary">
      <ChatSidebarProvider>
        <Outlet />
        <FloatingHelpButton />
      </ChatSidebarProvider>
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;
