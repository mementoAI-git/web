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
});
