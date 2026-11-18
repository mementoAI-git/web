export const THEME_STORAGE_KEY = "memento:theme";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "deep-sky" | "light-sky" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "deep-sky" || value === "light-sky" || value === "system";
}

/** Dark is the default until someone picks a theme. */
export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" ? "light-sky" : isThemePreference(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
}

export function getSystemTheme(): ResolvedTheme {
  try {
    return window.matchMedia?.(DARK_MODE_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function resolveTheme(theme: ThemePreference): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme === "deep-sky" ? "dark" : theme === "light-sky" ? "light" : theme;
}

export function applyResolvedTheme(theme: ResolvedTheme, preference: ThemePreference = theme): void {
  document.documentElement.classList.toggle("daylight", theme === "light" && preference !== "light-sky");
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("deep-sky", preference === "deep-sky");
  document.documentElement.classList.toggle("light-sky", preference === "light-sky");
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme(): ResolvedTheme {
  const preference = readThemePreference();
  const resolved = resolveTheme(preference);
  applyResolvedTheme(resolved, preference);
  return resolved;
}
