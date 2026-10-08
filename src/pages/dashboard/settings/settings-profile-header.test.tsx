import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
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

const token = "f880209e-7c70-4e99-9ddf-ff180f220f21";
beforeEach(() => {
  server.use(
    http.post("http://localhost:3000/api/users/profile/share", () =>
      HttpResponse.json({ success: true, data: { token } }),
    ),
  );
});

describe("SettingsProfileHeader", () => {
  it("renders the profile actions without duplicating the bio", () => {
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });

    expect(screen.getByText("Your name")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Profile" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(
      screen.queryByText(/add a short introduction/i),
    ).not.toBeInTheDocument();
  });

  it("copies an actual public profile URL without exposing email or a private settings URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/profile/${token}`,
      ),
    );
  });

  it("includes the profile URL in native sharing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "Your name on Memento",
        text: "View my Memento profile",
        url: `${window.location.origin}/profile/${token}`,
      }),
    );
  });

  it("does not copy a broken link if publication fails", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    server.use(
      http.post("http://localhost:3000/api/users/profile/share", () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share" })).toBeEnabled(),
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it("does not render the stats-tab insights carousel on the profile header", () => {
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    expect(screen.queryByText("Your insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Enrichment score")).not.toBeInTheDocument();
    expect(screen.queryByText("Memories captured")).not.toBeInTheDocument();
    expect(screen.queryByText("Active streak")).not.toBeInTheDocument();
    expect(screen.queryByText("Top dimension")).not.toBeInTheDocument();
  });

  it("exposes change photo control linked to file input", () => {
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    const fileInput = screen.getByLabelText(/change profile photo/i);
    expect(fileInput).toHaveAttribute("type", "file");
  });

  it("offers a custom image upload without Disco choices", () => {
    renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Change banner" }));
    expect(
      screen.queryByRole("button", { name: /Disco banner/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Upload banner image")).toHaveAttribute(
      "type",
      "file",
    );
  });

  it("lays out email and member-since metadata with flex alignment", () => {
    const { container } = renderWithProviders(<SettingsProfileHeader />, {
      route: "/settings/general",
      auth: true,
    });
    const metaRow = container.querySelector(
      "p.font-inter.text-sm.text-v3-text-weak",
    );
    expect(metaRow).toBeTruthy();
    expect(metaRow).toHaveClass("flex", "items-center", "justify-start");
  });
});
