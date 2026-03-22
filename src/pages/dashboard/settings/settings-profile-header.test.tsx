import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { SettingsProfileHeader } from "./settings-profile-header";

const openModal = vi.fn();
const logout = vi.fn();

vi.mock("@/hooks/use-modal", () => ({
  initialStates: { state: [] },
  ModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useModal: () => ({
    state: [],
    open: openModal,
    close: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ logout, loading: false }),
}));

describe("SettingsProfileHeader", () => {
  it("renders profile shell, placeholder copy when user is not hydrated, and revisit preferences", () => {
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });

    expect(screen.getByText("Your name")).toBeInTheDocument();
    expect(
      screen.getByText(/add a short introduction when you revisit preferences/i),
    ).toBeInTheDocument();

    const revisitLinks = screen.getAllByRole("link", { name: /revisit preferences/i });
    expect(revisitLinks.length).toBeGreaterThanOrEqual(1);
    revisitLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/onboard/misc");
    });
  });

  it("requests memory insights modal when See insights is clicked", async () => {
    openModal.mockClear();
    const user = userEvent.setup();
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });

    await user.click(screen.getByRole("button", { name: /see insights/i }));
    expect(openModal).toHaveBeenCalledWith("memory-insights");
  });

  it("exposes change photo control linked to file input", () => {
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });
    const fileInput = screen.getByLabelText(/change profile photo/i);
    expect(fileInput).toHaveAttribute("type", "file");
  });

  it("calls logout when Log out is activated", async () => {
    logout.mockClear();
    const user = userEvent.setup();
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });
    await user.click(screen.getByRole("button", { name: /log out/i }));
    expect(logout).toHaveBeenCalled();
  });
});
