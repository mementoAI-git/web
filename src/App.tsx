import { Outlet } from "react-router-dom";
import { FloatingButton } from "./components/FloatingButton";
import { useModal } from "./hooks/use-modal";

const SIDE_MODALS = ["create-memory"];

function App() {
  const { open, state } = useModal();
  const isSideModalOpen = state?.some((m) => SIDE_MODALS.includes(m.name));

  return (
    <div className="min-h-screen bg-background text-secondary">
      <Outlet />

      <div
        className={`absolute text-5xl z-9999 group animate-fade-in-up transition-all ${
          isSideModalOpen ? "left-[6px] bottom-[6px]" : "right-4 bottom-4"
        }`}
      >
        <div className="relative">
          <FloatingButton
            onClick={() => open("create-feedback")}
            className="h-10 w-10 min-w-10 min-h-10 bg-orange rounded-full! p-0!"
          >
            <img
              src="/question.gif"
              alt="Need help?"
              className="size-10 w-10 h-10 object-contain rounded-full brightness-0 invert"
            />
          </FloatingButton>

          {/* Tooltip */}
          <div className="absolute text-xs right-full top-1/2 -translate-x-1 -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white px-2 py-1 rounded shadow whitespace-nowrap">
            Need help?
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
