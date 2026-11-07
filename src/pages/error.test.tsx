import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import ErrorPage from "./error";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ErrorPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders illustration, copy, and actions", () => {
    renderWithProviders(<ErrorPage />, { route: "/error", auth: false });

    expect(screen.getByRole("img", { name: /^error$/i })).toBeInTheDocument();
    expect(screen.getByText("Error 505")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sorry, we seem to be having an issue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we have been automatically notified of this issue/i),
    ).toHaveClass("font-rounded");
    expect(screen.getByTestId("error-state-panel")).toHaveClass("backdrop-blur-xl");

    expect(screen.getByRole("button", { name: /go back/i })).toHaveAttribute("data-variant", "outline");
    expect(screen.getByRole("button", { name: /homepage/i })).toBeInTheDocument();
  });

  it("navigates back and to home when actions are used", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ErrorPage />, { route: "/error", auth: false });

    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    await user.click(screen.getByRole("button", { name: /homepage/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
