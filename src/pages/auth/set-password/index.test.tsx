import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test";

import SetPasswordPage from "./index";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("token=mock-reset-token")],
  };
});

describe("SetPasswordPage", () => {
  it("renders password fields and submit", () => {
    renderWithProviders(<SetPasswordPage />, {
      route: "/set-password?token=mock-reset-token",
    });

    expect(
      screen.getByRole("heading", { name: /enter a new password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^new password$/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^confirm password$/i, { selector: "input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset password/i }),
    ).toBeInTheDocument();
  });
  it("toggles each password independently", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);
    await user.click(screen.getByRole("button", { name: "Show new password" }));
    expect(
      screen.getByLabelText("New password", { selector: "input" }),
    ).toHaveAttribute("type", "text");
    expect(
      screen.getByLabelText("Confirm password", { selector: "input" }),
    ).toHaveAttribute("type", "password");
  });

  it("shows success on login only after the reset succeeds", async () => {
    server.use(
      http.post("http://localhost:3000/api/auth/set-password", () =>
        HttpResponse.json({
          success: true,
          message: "Password reset successful",
          data: null,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<SetPasswordPage />);
    await user.type(
      screen.getByLabelText("New password", { selector: "input" }),
      "Example1!",
    );
    await user.type(
      screen.getByLabelText("Confirm password", { selector: "input" }),
      "Example1!",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        replace: true,
        state: { passwordReset: true },
      }),
    );
  });
});
