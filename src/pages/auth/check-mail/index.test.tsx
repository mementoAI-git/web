import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import CheckMailPage from "./index";
const API = "http://localhost:3000/api";
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));
const renderPage = () =>
  renderWithProviders(<CheckMailPage />, {
    route: "/check-mail?email=jane%2Btest%40example.com",
  });

describe("CheckMailPage recovery code", () => {
  beforeEach(() => mockNavigate.mockClear());
  it("accepts pasted codes and exchanges the code for a reset token", async () => {
    server.use(
      http.post(`${API}/auth/recovery/verify-code`, async ({ request }) => {
        expect(await request.json()).toEqual({
          email: "jane+test@example.com",
          code: "012345",
        });
        return HttpResponse.json({
          success: true,
          data: { token: "reset-token" },
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();
    await user.click(screen.getByLabelText("Digit 1 of 6"));
    await user.paste("012345");
    await user.click(screen.getByRole("button", { name: "Verify code" }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/set-password?token=reset-token",
        { replace: true },
      ),
    );
  });
  it("rejects an expired code without navigating", async () => {
    server.use(
      http.post(`${API}/auth/recovery/verify-code`, () =>
        HttpResponse.json(
          { message: "Invalid or expired code" },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText("Digit 1 of 6"));
    await user.paste("123456");
    await user.click(screen.getByRole("button", { name: "Verify code" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid or expired code/i,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it("resends and prevents repeated resend clicks during cooldown", async () => {
    const send = vi.fn();
    server.use(
      http.post(`${API}/auth/recovery/send-code`, async ({ request }) => {
        send(await request.json());
        return HttpResponse.json({ success: true, data: { resend_after: 60 } });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByText(/resend code in 60s/i)).toBeDisabled();
    expect(send).toHaveBeenCalledWith({ email: "jane+test@example.com" });
  });
  it("moves focus between digits and backspace without accepting letters", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText("Digit 1 of 6"), "a1");
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveValue("1");
    expect(screen.getByLabelText("Digit 2 of 6")).toHaveFocus();
    await user.keyboard("{Backspace}");
    expect(screen.getByLabelText("Digit 1 of 6")).toHaveFocus();
  });
  it("redirects a missing email to the request screen", async () => {
    renderWithProviders(<CheckMailPage />, { route: "/check-mail" });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/forget-password", {
        replace: true,
      }),
    );
  });
});
