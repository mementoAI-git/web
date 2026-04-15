import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import Stats from "./stats";

const openModal = vi.fn();

vi.mock("@/hooks/use-modal", () => ({
  initialStates: { state: [] },
  ModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useModal: () => ({
    state: [],
    open: openModal,
    close: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("Stats", () => {
  it("renders heading, intro, and insights section", () => {
    renderWithProviders(<Stats />, { route: "/settings/stats", auth: true });

    expect(screen.getByText(/^stats$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/highlights from your activity and how your memento is growing/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Your insights")).toBeInTheDocument();
  });

  it("opens memory insights modal when See full insights is pressed", async () => {
    openModal.mockClear();
    const user = userEvent.setup();
    renderWithProviders(<Stats />, { route: "/settings/stats", auth: true });

    await user.click(screen.getByRole("button", { name: /see full insights/i }));
    expect(openModal).toHaveBeenCalledWith("memory-insights");
  });
});
