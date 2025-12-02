import { Outlet } from "react-router-dom";
import { useState } from "react";
import { FeedbackModal } from "./components/modal/feedback";
import { FloatingButton } from "./components/Buttons";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-secondary">
      <Outlet />

      {isOpen && (
        <FeedbackModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          user={null}
        />
      )}

      <div className="absolute bottom-4 right-4 text-5xl z-9999 group animate-fade-in-up">
        <div className="relative">
          <FloatingButton
            onClick={() => setIsOpen((state) => !state)}
            className="h-auto bg-transparent rounded-full! w-10 aspect-square! p-0!"
          >
            <img
              src="/question.gif"
              alt="hh"
              className="w-full h-full rounded-full"
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
