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
  it("renders profile field rows including birthday and country", () => {
    renderWithProviders(<General />, { route: "/settings/general", auth: true });

    expect(screen.getByText("Display name:")).toBeInTheDocument();
    expect(screen.getByText("Tester")).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    expect(screen.getByText("First name:")).toBeInTheDocument();
    expect(screen.getByText("Last name:")).toBeInTheDocument();
    expect(screen.getByText("Phone:")).toBeInTheDocument();
    expect(screen.getByText("Location:")).toBeInTheDocument();
    expect(screen.getByText("Birthday:")).toBeInTheDocument();
    expect(screen.getByText("January 1, 1990")).toBeInTheDocument();
    expect(screen.getByText("Country:")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
  });

  it("opens inline editor when edit is activated for a field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<General />, { route: "/settings/general", auth: true });

    await user.click(screen.getByRole("button", { name: /edit first name/i }));
    expect(screen.getByRole("textbox", { name: /first name/i })).toBeInTheDocument();
  });

  it("copies email when copy control is used", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    renderWithProviders(<General />, { route: "/settings/general", auth: true });

    await screen.findByText("test@example.com");
    const copyBtn = await screen.findByRole("button", { name: /copy email address/i });
    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith("test@example.com");
  });
});
