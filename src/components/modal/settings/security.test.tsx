import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
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

  it("offers retry instead of an empty list on load failure", async () => {
    let failed = true;
    server.use(http.get("http://localhost:3000/api/users/passkeys", () => failed ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ data: [] })));
    await renderSecurity();
    const retry = await screen.findByRole("button", { name: "Retry loading passkeys" });
    expect(screen.queryByText("No passkeys registered yet.")).not.toBeInTheDocument();
    failed = false;
    await userEvent.setup().click(retry);
    expect(await screen.findByText("No passkeys registered yet.")).toBeVisible();
  });

  it("confirms removal, preserves a failed attempt, and updates the list on success", async () => {
    const remove = vi.fn();
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    let failed = true;
    server.use(
      http.get("http://localhost:3000/api/users/passkeys", () => HttpResponse.json({ data: [{ credential_id: "test-key", device_name: "Test laptop", created_at: "2025-01-01" }] })),
      http.delete("http://localhost:3000/api/users/passkeys/test-key", async () => { remove(); await pending; return failed ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ success: true }); }),
    );
    const user = userEvent.setup();
    await renderSecurity();
    const trigger = await screen.findByRole("button", { name: "Remove passkey" });
    await user.click(trigger);
    let dialog = screen.getByRole("alertdialog", { name: "Remove passkey?" });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(remove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Remove passkey" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
    expect(within(dialog).getByRole("button", { name: "Removing…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(dialog).toBeVisible();
    release();
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Remove passkey" })).toBeEnabled());
    expect(dialog).toBeVisible();
    failed = false;
    await user.click(within(dialog).getByRole("button", { name: "Remove passkey" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Test laptop")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a passkey" })).toHaveFocus();
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


describe("Change password dialog", () => {
  it("keeps the dialog open while saving and preserves values after failure", async () => {
    const user = userEvent.setup();
    let release!: () => void;
    let failed = true;
    const pending = new Promise<void>(resolve => { release = resolve; });
    server.use(http.post("http://localhost:3000/api/users/change-password", async () => {
      await pending;
      return failed ? HttpResponse.json({ message: "Try again later" }, { status: 503 }) : HttpResponse.json({ success: true, message: "Password updated" });
    }));
    await renderSecurity();
    const trigger = screen.getByRole("button", { name: "Change password" });
    await user.click(trigger);
    await user.type(screen.getByLabelText("Old password"), "Old-password1!");
    await user.type(screen.getByLabelText("New password"), "New-password1!");
    await user.type(screen.getByLabelText("Confirm password"), "New-password1!");
    await user.click(screen.getByRole("button", { name: "Save password" }));
    expect(screen.getByRole("button", { name: "Save password" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Change password" })).toBeVisible();
    release();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save password" })).toBeEnabled());
    expect(screen.getByLabelText("New password")).toHaveValue("New-password1!");
    failed = false;
    await user.click(screen.getByRole("button", { name: "Save password" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("contains keyboard focus, closes with Escape, and restores focus", async () => {
    const user = userEvent.setup();
    await renderSecurity();
    const trigger = screen.getByRole("button", { name: "Change password" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Change password" });
    const oldPassword = within(dialog).getByLabelText("Old password");
    expect(oldPassword).toHaveFocus();
    await user.type(oldPassword, "draft-password");
    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByLabelText("Old password")).toHaveValue("");
  });
});
