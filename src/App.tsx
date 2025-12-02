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

      <div className="absolute bottom-4 right-4 text-5xl z-9999">
        <FloatingButton
          onClick={() => setIsOpen((state) => !state)}
          className="h-auto rounded-full! w-10 aspect-square! p-0!"
        >
          <img
            src="question.gif"
            alt="hh"
            className="w-full h-full rounded-full"
          />
        </FloatingButton>
      </div>
    </div>
  );
}

export default App;
