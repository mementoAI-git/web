export const THEME_STORAGE_KEY = "memento:theme";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
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
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme(): ResolvedTheme {
  const resolved = resolveTheme(readThemePreference());
  applyResolvedTheme(resolved);
  return resolved;
}
