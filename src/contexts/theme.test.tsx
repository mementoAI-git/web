import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeTheme, THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeProvider, useTheme } from "./theme";

function installMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    get matches() {
      return dark;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
  } as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );

  return {
    get listenerCount() {
      return listeners.size;
    },
    setDark(nextDark: boolean) {
      dark = nextDark;
      const event = {
        matches: dark,
        media: query.media,
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button onClick={() => setTheme("system")}>Use system</button>
      <button onClick={() => setTheme("dark")}>Use dark</button>
      <button onClick={() => setTheme("deep-sky")}>Use deep sky</button>
      <button onClick={() => setTheme("light-sky")}>Use light sky</button>
    </>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("application theme", () => {
  it("restores light sky before mount even when the OS is dark", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light-sky");
    const media = installMatchMedia(true);
    expect(initializeTheme()).toBe("light");
    expect(document.documentElement).toHaveClass("light-sky");
    expect(document.documentElement).not.toHaveClass("dark", "deep-sky");
    renderTheme();
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.querySelector(".deep-sky-backdrop")).toHaveAttribute("aria-hidden", "true");
    act(() => media.setDark(false));
    act(() => media.setDark(true));
    expect(screen.getByTestId("theme")).toHaveTextContent("light-sky");
    fireEvent.click(screen.getByRole("button", { name: "Use system" }));
    expect(document.documentElement).not.toHaveClass("light-sky");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.querySelector(".deep-sky-backdrop")).toBeNull();
  });

  it("restores deep sky before mount with dark controls", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "deep-sky");
    installMatchMedia(false);
    expect(initializeTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark", "deep-sky");
    renderTheme();
    expect(screen.getByTestId("theme")).toHaveTextContent("deep-sky");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.querySelector(".deep-sky-backdrop")).toHaveAttribute("aria-hidden", "true");
  });

  it("persists deep sky, ignores OS changes, and removes its backdrop on plain dark", () => {
    const media = installMatchMedia(false);
    renderTheme();
    fireEvent.click(screen.getByRole("button", { name: "Use deep sky" }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("deep-sky");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark", "deep-sky");
    act(() => media.setDark(true));
    act(() => media.setDark(false));
    expect(screen.getByTestId("theme")).toHaveTextContent("deep-sky");
    fireEvent.click(screen.getByRole("button", { name: "Use dark" }));
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("deep-sky");
    expect(document.querySelector(".deep-sky-backdrop")).toBeNull();
  });

  it("defaults to system and follows OS changes from light to dark", () => {
    const media = installMatchMedia(false);
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");

    act(() => media.setDark(true));

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("restores dark, then selecting system persists it and resolves current OS light", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    installMatchMedia(false);
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    fireEvent.click(screen.getByRole("button", { name: "Use system" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("initializes the root synchronously before React mounts", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    installMatchMedia(false);

    expect(initializeTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("uses system for an invalid stored preference", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    installMatchMedia(true);
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("falls back to light when matchMedia and storage are unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("keeps a new selection in memory when storage rejects writes", () => {
    installMatchMedia(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    renderTheme();

    fireEvent.click(screen.getByRole("button", { name: "Use dark" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("stops following OS changes after a manual selection", () => {
    const media = installMatchMedia(false);
    renderTheme();
    expect(media.listenerCount).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Use dark" }));
    expect(media.listenerCount).toBe(0);

    act(() => media.setDark(true));
    act(() => media.setDark(false));

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("removes the system listener on unmount under StrictMode", () => {
    const media = installMatchMedia(false);
    const { unmount } = render(
      <StrictMode>
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      </StrictMode>,
    );

    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    expect(media.listenerCount).toBe(1);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");

    unmount();
    expect(media.listenerCount).toBe(0);
    act(() => media.setDark(true));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("requires a ThemeProvider", () => {
    function OutsideProvider() {
      useTheme();
      return null;
    }

    expect(() => render(<OutsideProvider />)).toThrow("ThemeProvider");
  });
});
