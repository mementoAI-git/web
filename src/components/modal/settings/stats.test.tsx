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
  it("hides page heading when embedded", () => {
    renderWithProviders(<Stats embedded />, { route: "/settings/general?view=stats", auth: true });

    expect(screen.queryByText(/^stats$/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/highlights from your activity and how your memento is growing/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("At a glance")).toBeInTheDocument();
  });

  it("renders heading, intro, and insights section", () => {
    renderWithProviders(<Stats />, { route: "/settings/general?view=stats", auth: true });

    expect(screen.getByText(/^stats$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/highlights from your activity and how your memento is growing/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("At a glance")).toBeInTheDocument();
  });

  it("opens memory insights modal when See full insights is pressed", async () => {
    openModal.mockClear();
    const user = userEvent.setup();
    renderWithProviders(<Stats />, { route: "/settings/general?view=stats", auth: true });

    await user.click(screen.getByRole("button", { name: /see full insights/i }));
    expect(openModal).toHaveBeenCalledWith("memory-insights");
  });

  it("sends Update my story to misc revisit mode", () => {
    renderWithProviders(<Stats />, { route: "/settings/general?view=stats", auth: true });

    expect(screen.getByRole("link", { name: /update my story/i })).toHaveAttribute(
      "href",
      "/onboarding/misc?mode=revisit",
    );
  });
});
