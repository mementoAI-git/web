import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/theme";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeSwitcher } from "./theme-switcher";

afterEach(() => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

it.each([false, true])("starts with system dark=%s and toggles directly to the opposite mode", async (dark) => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: dark, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const user = userEvent.setup();
  const { unmount } = render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  expect(document.documentElement.classList.contains("dark")).toBe(dark);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  const next = dark ? "light" : "dark";
  await user.click(screen.getByRole("button", { name: `Switch to ${next} mode` }));
  expect(document.documentElement.classList.contains("dark")).toBe(!dark);
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(next);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  unmount();
  render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  expect(document.documentElement.classList.contains("dark")).toBe(!dark);
  await user.tab();
  await user.keyboard("{Enter}");
  expect(document.documentElement.classList.contains("dark")).toBe(dark);
});
