import { Outlet } from "react-router-dom";
import { Agentation } from "agentation";
import { Retune } from "retune";
import { FloatingChatButton } from "./components/floating-chat-button";
import { ChatSidebarProvider } from "./contexts/chat-sidebar";

function App() {
  return (
    <div className="min-h-screen bg-background text-secondary">
      <ChatSidebarProvider>
        <Outlet />
        <FloatingChatButton />
      </ChatSidebarProvider>
      <Retune />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;
