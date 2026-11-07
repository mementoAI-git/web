import { Outlet } from "react-router-dom";
import { Agentation } from "agentation";
import { Retune } from "retune";
import { ChatSidebarProvider } from "./contexts/chat-sidebar";

function App() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ChatSidebarProvider>
        <Outlet />
      </ChatSidebarProvider>
      <Retune />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

export default App;
