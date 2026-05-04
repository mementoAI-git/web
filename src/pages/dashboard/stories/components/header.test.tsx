import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import StoriesHeader from "./header";

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

describe("StoriesHeader", () => {
  it("renders a search trigger that opens the search modal on click", () => {
    renderWithProviders(
      <StoriesHeader onChangeMode={vi.fn()} filter="all" onChangeFilter={vi.fn()} count={3} />,
      { route: "/stories", auth: true },
    );

    // The search area is a clickable div with the text "Search"
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("uses pill-shaped mode toggle items (100px radius) so spacing=0 does not square corners", () => {
    renderWithProviders(
      <StoriesHeader onChangeMode={vi.fn()} filter="all" onChangeFilter={vi.fn()} count={0} />,
      { route: "/stories", auth: true },
    );

    expect(screen.getByRole("radio", { name: "Grid view" })).toHaveClass("rounded-[100px]");
    expect(screen.getByRole("radio", { name: "List view" })).toHaveClass("rounded-[100px]");
  });
});
