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
  it("aligns the section tabs with the left edge of their container", () => {
    renderWithProviders(<General />, {
      route: "/settings/general",
      auth: true,
    });
    expect(
      screen.getByRole("tablist", { name: "Personal information sections" }),
    ).toHaveClass("w-full", "justify-start", "p-0");
  });

  it("renders editable profile fields directly in the card", () => {
    renderWithProviders(<General />, {
      route: "/settings/general?view=profile",
      auth: true,
    });

    expect(screen.getByText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Tester");
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveValue("Test");
    expect(screen.getByText("Last name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toHaveValue("User");
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveValue("+1234567890");
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toHaveValue("");
    expect(screen.getByText("Birthday")).toBeInTheDocument();
    expect(screen.getByLabelText("Birthday")).toHaveValue("1990-01-01");
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toHaveValue("US");
    // Profile and social links are separate forms, each with its own save.
    expect(
      screen.getAllByRole("button", { name: /save changes/i })[0],
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
  });

  it("enables saving when the inline form changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<General />, {
      route: "/settings/general?view=profile",
      auth: true,
    });

    await user.type(screen.getByLabelText("First name"), " updated");
    expect(screen.getAllByRole("button", { name: /save changes/i })[0]).toBeEnabled();
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
      screen.getAllByRole("button", { name: /save changes/i }),
    ).toHaveLength(2);
    await user.click(screen.getByRole("tab", { name: "Activities" }));
    expect(
      await screen.findByRole("heading", { name: /recent activities/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("What are your thoughts on the..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save changes/i }),
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
