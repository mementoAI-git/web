import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import { GeneralProfileEditModal } from "./general-profile-edit-modal";

vi.mock("@/hooks/use-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-store")>();
  return {
    ...actual,
    useStore: () => {
      const base = actual.useStore();
      return { ...base, user: mockUser, hydrated: true };
    },
  };
});

describe("GeneralProfileEditModal", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "scrollTo",
      vi.fn(() => {
        /* noop for portals in jsdom */
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens with user values and closes on Cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <GeneralProfileEditModal open onOpenChange={onOpenChange} />,
      { auth: true },
    );

    expect(await screen.findByRole("dialog", { name: /edit profile/i })).toBeInTheDocument();
    const displayName = screen.getByRole("textbox", { name: /display name/i });
    expect(displayName).toHaveValue("Tester");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits profile changes and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <GeneralProfileEditModal open onOpenChange={onOpenChange} />,
      { auth: true },
    );

    const displayName = await screen.findByRole("textbox", { name: /display name/i });
    await user.clear(displayName);
    await user.type(displayName, "NewNick");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
