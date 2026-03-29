import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { SettingsProfileHeader } from "./settings-profile-header";

vi.mock("@/hooks/use-modal", () => ({
  initialStates: { state: [] },
  ModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useModal: () => ({
    state: [],
    open: vi.fn(),
    close: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("SettingsProfileHeader", () => {
  it("renders profile shell and placeholder copy when bio is empty", () => {
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });

    expect(screen.getByText("Your name")).toBeInTheDocument();
    expect(
      screen.getByText(/add a short introduction when you revisit preferences/i),
    ).toBeInTheDocument();
  });

  it("does not render the stats-tab insights carousel on the profile header", () => {
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });
    expect(screen.queryByText("Your insights")).not.toBeInTheDocument();
  });

  it("exposes change photo control linked to file input", () => {
    renderWithProviders(<SettingsProfileHeader />, { route: "/settings/general", auth: true });
    const fileInput = screen.getByLabelText(/change profile photo/i);
    expect(fileInput).toHaveAttribute("type", "file");
  });

  it("lays out email and member-since metadata with flex alignment", () => {
    const { container } = renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    const metaRow = container.querySelector("p.font-inter.text-sm.text-v3-text-weak");
    expect(metaRow).toBeTruthy();
    expect(metaRow).toHaveClass("flex", "items-center", "justify-start");
  });
});
