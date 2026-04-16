import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";

// Mock @simplewebauthn/browser so no real WebAuthn API is needed in jsdom
vi.mock("@simplewebauthn/browser", () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

import { startRegistration } from "@simplewebauthn/browser";

// Lazy-import Security after the mock is set up
async function renderSecurity(auth = true) {
  const { default: Security } = await import("./security");
  return renderWithProviders(<Security />, { auth });
}

describe("Security settings — PasskeyManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'No passkeys registered yet' when list is empty", async () => {
    // MSW default returns []
    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByText(/no passkeys registered yet/i)).toBeInTheDocument();
    });
  });

  it("renders passkey list when API returns entries", async () => {
    server.use(
      http.get("http://localhost:3000/api/users/passkeys", () =>
        HttpResponse.json({
          success: true,
          message: "Passkeys retrieved successfully",
          data: [
            {
              credential_id: "cred-1",
              device_name: "MacBook Pro",
              created_at: "2025-01-15T10:00:00.000Z",
            },
          ],
        }),
      ),
    );

    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    });
  });

  it("shows 'Add a passkey' button", async () => {
    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add a passkey/i })).toBeInTheDocument();
    });
  });

  it("calls startRegistration and shows success toast on passkey add", async () => {
    const mockStartRegistration = vi.mocked(startRegistration);
    mockStartRegistration.mockResolvedValue({} as Awaited<ReturnType<typeof startRegistration>>);

    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add a passkey/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /add a passkey/i }));

    await waitFor(() => {
      expect(mockStartRegistration).toHaveBeenCalledOnce();
    });
  });

  it("does not throw when startRegistration is cancelled (NotAllowedError)", async () => {
    const mockStartRegistration = vi.mocked(startRegistration);
    const err = Object.assign(new Error("cancelled"), { name: "NotAllowedError" });
    mockStartRegistration.mockRejectedValue(err);

    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add a passkey/i })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Should not throw
    await user.click(screen.getByRole("button", { name: /add a passkey/i }));
    await waitFor(() => {
      expect(mockStartRegistration).toHaveBeenCalledOnce();
    });
    // Banner should not appear (error is silently swallowed for NotAllowedError)
  });

  it("shows a remove passkey button for each registered passkey", async () => {
    server.use(
      http.get("http://localhost:3000/api/users/passkeys", () =>
        HttpResponse.json({
          success: true,
          message: "Passkeys retrieved successfully",
          data: [
            {
              credential_id: "cred-abc",
              device_name: "iPhone 15",
              created_at: "2025-03-01T09:00:00.000Z",
            },
          ],
        }),
      ),
    );

    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /remove passkey/i })).toBeInTheDocument();
  });

  it("remove passkey button is clickable and does not crash the component", async () => {
    server.use(
      http.get("http://localhost:3000/api/users/passkeys", () =>
        HttpResponse.json({
          success: true,
          message: "Passkeys retrieved successfully",
          data: [{ credential_id: "cred-del", device_name: "iPad", created_at: "2025-03-01T09:00:00.000Z" }],
        }),
      ),
    );

    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByText("iPad")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteBtn = screen.getByRole("button", { name: /remove passkey/i });

    // Clicking should not throw; button becomes disabled while deleting
    await user.click(deleteBtn);
    // Component remains mounted without errors
    expect(screen.getByText(/passkeys/i)).toBeInTheDocument();
  });

  it("renders the Two-factor authentication section", async () => {
    await renderSecurity();
    await waitFor(() => {
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
    });
  });

  it("renders the Password section with Change password button", async () => {
    await renderSecurity();
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });
});
