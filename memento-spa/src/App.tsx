import { Outlet } from "react-router-dom";
function App() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
      <Outlet />
    </div>
  );
}

export default App;
