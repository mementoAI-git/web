import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "@/test";

import SetPasswordPage from "./index";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("token=mock-reset-token")],
  };
});

describe("SetPasswordPage", () => {
  it("renders password fields and submit", () => {
    renderWithProviders(<SetPasswordPage />, { route: "/set-password?token=mock-reset-token" });

    expect(screen.getByRole("heading", { name: /set new password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set new password/i })).toBeInTheDocument();
  });
});
