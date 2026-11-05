import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/theme";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeSwitcher } from "./theme-switcher";

afterEach(() => vi.unstubAllGlobals());

it("offers deep sky alongside dark and restores the choice on remount", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  expect(screen.getAllByRole("menuitemradio").map((item) => item.textContent)).toEqual(["Light sky", "Dark", "Deep sky", "System"]);
  expect(screen.getByRole("menuitemradio", { name: "Light sky" }).querySelector("svg.lucide-sun")).toBeInTheDocument();
  await user.click(screen.getByRole("menuitemradio", { name: "Deep sky" }));
  expect(document.documentElement).toHaveClass("dark", "deep-sky");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("deep-sky");
  unmount();
  render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  expect(screen.getByRole("menuitemradio", { name: "Deep sky" })).toHaveAttribute("aria-checked", "true");
  await user.click(screen.getByRole("menuitemradio", { name: "Light sky", exact: true }));
  expect(document.documentElement).not.toHaveClass("dark", "deep-sky");
});

it("supports choosing dark with the keyboard and returning to system", async () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const user = userEvent.setup();
  render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  await user.tab();
  await user.keyboard("{Enter}{ArrowDown}{Enter}");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  await user.click(screen.getByRole("menuitemradio", { name: "System" }));
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  expect(document.documentElement).not.toHaveClass("dark");
});

it("selects light sky and keeps its own checked preference after remount", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  await user.click(screen.getByRole("menuitemradio", { name: "Light sky" }));
  expect(document.documentElement).toHaveClass("light-sky");
  expect(document.documentElement).not.toHaveClass("dark", "deep-sky");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light-sky");
  unmount();
  render(<ThemeProvider><ThemeSwitcher /></ThemeProvider>);
  await user.click(screen.getByRole("button", { name: "Choose theme" }));
  expect(screen.getByRole("menuitemradio", { name: "Light sky" })).toHaveAttribute("aria-checked", "true");
  await user.click(screen.getByRole("menuitemradio", { name: "Deep sky" }));
  expect(document.documentElement).not.toHaveClass("light-sky");
  expect(document.documentElement).toHaveClass("dark", "deep-sky");
});
