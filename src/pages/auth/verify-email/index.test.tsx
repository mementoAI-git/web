import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import VerifyEmailPage from "./index";
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mockNavigate,
}));
const API = "http://localhost:3000/api";
const renderPage = () =>
  renderWithProviders(<VerifyEmailPage />, {
    route: "/verify-email?email=jane%2Btest%40example.com",
  });
describe("VerifyEmailPage", () => {
  beforeEach(() => mockNavigate.mockClear());
  it("uses the OTP layout with six inputs and no mailbox card", () => {
    const { container } = renderPage();
    expect(
      screen.getByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(
      container.querySelector(".auth-entry-main-recovery"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open mailbox" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();
  });
  it("requests a verification code through the existing API", async () => {
    const requestCode = vi.fn();
    server.use(
      http.post(`${API}/auth/send-link`, async ({ request }) => {
        requestCode(await request.json());
        return HttpResponse.json({
          success: true,
          data: { email: "jane+test@example.com", delivery: "code" },
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Resend code" }));
    expect(await screen.findByText("Resend code in 60s")).toBeDisabled();
    expect(requestCode).toHaveBeenCalledWith({
      email: "jane+test@example.com",
      type: "verify",
      delivery: "code",
    });
  });
  it.each([false, true])(
    "verifies pasted codes and routes by onboarding status (%s)",
    async (onboarded) => {
      server.use(
        http.post(`${API}/auth/verify-email`, async ({ request }) => {
          expect(await request.json()).toEqual({
            email: "jane+test@example.com",
            token: "012345",
            type: "verify",
          });
          return HttpResponse.json({
            success: true,
            data: {
              access_token: "verified-token",
              refresh_token: "refresh-token",
              onboarded,
              access_expires_at: "2099-01-01T00:00:00Z",
              refresh_expires_at: "2099-02-01T00:00:00Z",
            },
          });
        }),
      );
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByLabelText("Digit 1 of 6"));
      await user.paste("012345");
      await user.click(screen.getByRole("button", { name: "Verify code" }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          onboarded ? "/overview" : "/onboarding",
          {
            replace: true,
          },
        ),
      );
    },
  );
  it("keeps an invalid code on the page with an error", async () => {
    server.use(
      http.post(`${API}/auth/verify-email`, () =>
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
      "Invalid or expired code",
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
