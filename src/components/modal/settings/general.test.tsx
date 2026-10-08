import { describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import General from "./general";

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

describe("General", () => {
  it("renders profile grid including birthday and country", () => {
    renderWithProviders(<General />, {
      route: "/settings/general?view=profile",
      auth: true,
    });

    expect(screen.getByText("Display name")).toBeInTheDocument();
    expect(screen.getByText("Tester")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Last name")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Add a location")).toBeInTheDocument();
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByText("January 1, 1990")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit profile/i }),
    ).toBeInTheDocument();
  });

  it("opens edit profile modal with all fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<General />, {
      route: "/settings/general?view=profile",
      auth: true,
    });

    await user.click(screen.getByRole("button", { name: /edit profile/i }));
    expect(
      await screen.findByRole("dialog", { name: /edit profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^first name$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^display name$/i }),
    ).toHaveValue("Tester");
  });

  it("copies email when copy control is used", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    renderWithProviders(<General />, {
      route: "/settings/general?view=profile",
      auth: true,
    });

    // Email appears in multiple places (profile header + field cell), so wait for the copy button
    const copyBtn = await screen.findByRole("button", {
      name: /copy email address/i,
    });
    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("test@example.com");
  });
  it("orders tabs About, Profile, Activities and defaults to About", () => {
    renderWithProviders(<General />, {
      route: "/settings/general",
      auth: true,
    });
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "About me",
      "Profile",
      "Activities",
    ]);
    expect(screen.getByRole("tab", { name: "About me" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "About me" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Enrichment score")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: /stats/i }),
    ).not.toBeInTheDocument();
  });
  it("switches between profile fields and the activity feed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<General />, {
      route: "/settings/general",
      auth: true,
    });
    await user.click(screen.getByRole("tab", { name: "Profile" }));
    expect(
      screen.getByRole("button", { name: /edit profile/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Activities" }));
    expect(
      await screen.findByRole("heading", { name: /recent activities/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("What are your thoughts on the..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "About me" }));
    expect(
      screen.getByRole("heading", { name: "About me" }),
    ).toBeInTheDocument();
  });
  it("resolves the removed stats view to About", () => {
    renderWithProviders(<General />, {
      route: "/settings/general?view=stats",
      auth: true,
    });
    expect(screen.getByRole("tab", { name: "About me" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText("At a glance")).not.toBeInTheDocument();
  });
});
