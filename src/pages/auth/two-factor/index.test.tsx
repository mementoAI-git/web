import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import TwoFactorPage from "./index";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("token=mock-2fa-token")],
  };
});

/** Type all 6 digits into the inputs. */
async function fillCode(user: ReturnType<typeof userEvent.setup>, digits: string) {
  const inputs = screen.getAllByRole("textbox");
  for (let i = 0; i < 6; i++) {
    await user.type(inputs[i], digits[i] ?? "0");
  }
}

describe("TwoFactorPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders 6 digit inputs", () => {
    renderWithProviders(<TwoFactorPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("Verify button is disabled until all 6 digits are entered", () => {
    renderWithProviders(<TwoFactorPage />);
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  it("typing a digit advances focus to the next input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "1");
    expect(inputs[1]).toHaveFocus();
  });

  it("filling all 6 digits enables the Verify button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    await fillCode(user, "123456");
    expect(screen.getByRole("button", { name: /verify/i })).not.toBeDisabled();
  });

  it("backspace on an empty input moves focus to the previous input", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.type(inputs[0], "5");
    expect(inputs[1]).toHaveFocus();

    await user.keyboard("{Backspace}");
    expect(inputs[0]).toHaveFocus();
  });

  it("navigates to /overview on successful submit (onboarded user)", async () => {
    const user = userEvent.setup();
    // MSW default handler returns onboarded: true for any non-"000000" code
    renderWithProviders(<TwoFactorPage />);
    await fillCode(user, "123456");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/overview", { replace: true });
    });
  });

  it("navigates to /onboard when server returns onboarded: false", async () => {
    server.use(
      http.post("http://localhost:3000/api/auth/2fa/verify", () =>
        HttpResponse.json({
          success: true,
          message: "Login successful",
          data: {
            access_token: "mock-token",
            refresh_token: "mock-refresh",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            refresh_expires_at: new Date(Date.now() + 86400000).toISOString(),
            onboarded: false,
            onboarding_status: "skipped",
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    await fillCode(user, "123456");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/onboard", { replace: true });
    });
  });

  it("clears digits on API error (code 000000 triggers MSW error response)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    await fillCode(user, "000000");
    await user.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
      for (const input of inputs) {
        expect(input.value).toBe("");
      }
    });
    expect(mockNavigate).not.toHaveBeenCalledWith("/overview", expect.anything());
  });

  it("Back to login button navigates to /login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorPage />);
    await user.click(screen.getByText(/back to login/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
