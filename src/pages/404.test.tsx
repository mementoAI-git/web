import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import NotFoundPage from "./404";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NotFoundPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders illustration, copy, and actions", () => {
    renderWithProviders(<NotFoundPage />, { route: "/missing", auth: false });

    expect(screen.getByRole("img", { name: /not found/i })).toBeInTheDocument();
    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByText(/sorry, we couldn't find that page/i)).toBeInTheDocument();
    expect(
      screen.getByText(/the page you are looking for doesn't exist or has been moved/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /go back/i })).toHaveClass("btn-outline-v3");
    expect(screen.getByRole("button", { name: /overview/i })).toBeInTheDocument();
  });

  it("navigates back and to home when actions are used", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />, { route: "/missing", auth: false });

    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/overview", { replace: true });

    await user.click(screen.getByRole("button", { name: /overview/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/overview");
  });
});
