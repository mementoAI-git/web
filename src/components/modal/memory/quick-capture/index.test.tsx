import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { useTheme } from "@/contexts/theme";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { QuickCapture } from "./index";

vi.mock("@emoji-mart/react", () => ({
  default: ({ theme }: { theme: string }) => <div role="status">Emoji theme: {theme}</div>,
}));

function ThemeSwitch() {
  const { setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>Switch to dark</button>;
}

afterEach(() => localStorage.removeItem(THEME_STORAGE_KEY));

describe("QuickCapture themes", () => {
  it.each([
    ["light", "light"],
    ["dark", "dark"],
    ["light-sky", "light"],
    ["deep-sky", "dark"],
  ])("uses the resolved emoji theme for %s", async (theme, resolved) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const user = userEvent.setup();
    renderWithProviders(<QuickCapture />, { auth: true });
    await user.click(screen.getByRole("button", { name: "Emoji", exact: true }));
    expect(screen.getByRole("status")).toHaveTextContent(`Emoji theme: ${resolved}`);
  });

  it("updates an open emoji picker when the theme changes", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const user = userEvent.setup();
    renderWithProviders(<><ThemeSwitch /><QuickCapture /></>, { auth: true });
    await user.click(screen.getByRole("button", { name: "Emoji", exact: true }));
    await user.click(screen.getByRole("button", { name: "Switch to dark" }));
    // The outside press closes the picker; reopening must use the new theme.
    if (!screen.queryByRole("status")) {
      await user.click(screen.getByRole("button", { name: "Emoji", exact: true }));
    }
    expect(screen.getByRole("status")).toHaveTextContent("Emoji theme: dark");
  });
});
