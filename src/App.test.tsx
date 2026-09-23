import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import App from "./App";
import { fetcher } from "@/api/fetcher";
import { ChatProvider } from "@/hooks/use-chat";
import { ModalProvider } from "@/hooks/use-modal";
import { StoreProvider } from "@/hooks/use-store";

vi.mock("retune", () => ({
  Retune: () => <div data-testid="retune-stub" />,
}));

vi.mock("agentation", () => ({
  Agentation: () => <div data-testid="agentation-stub" />,
}));

function renderAppWithOutlet() {
  return render(
    <StoreProvider>
      <ModalProvider>
        <ChatProvider>
          <SWRConfig
            value={{
              fetcher,
              dedupingInterval: 0,
              provider: () => new Map(),
            }}
          >
            <MemoryRouter initialEntries={["/"]}>
              <Routes>
                <Route path="/" element={<App />}>
                  <Route
                    index
                    element={<div data-testid="outlet-child">page</div>}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </SWRConfig>
        </ChatProvider>
      </ModalProvider>
    </StoreProvider>,
  );
}

describe("App", () => {
  it("renders the routed outlet and Retune slot", () => {
    renderAppWithOutlet();

    expect(screen.getByTestId("outlet-child")).toHaveTextContent("page");
    expect(screen.getByTestId("retune-stub")).toBeInTheDocument();
  });

  it("applies the root shell layout classes", () => {
    renderAppWithOutlet();

    const shell = screen.getByTestId("outlet-child").parentElement;
    expect(shell).toHaveClass("min-h-screen", "bg-background", "text-foreground");
  });
});
