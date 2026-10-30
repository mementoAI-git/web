import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  applyResolvedTheme,
  DARK_MODE_QUERY,
  getSystemTheme,
  readThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setPreference] = useState(readThemePreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const themeRef = useRef(theme);
  const resolvedTheme = theme === "system" ? systemTheme : resolveTheme(theme);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    const resolved = resolveTheme(nextTheme);
    themeRef.current = nextTheme;
    if (nextTheme === "system") setSystemTheme(resolved);
    setPreference(nextTheme);
    applyResolvedTheme(resolved, nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Keep the selected theme in memory when storage is unavailable.
    }
  }, []);

  useLayoutEffect(() => {
    applyResolvedTheme(resolvedTheme, theme);
  }, [resolvedTheme, theme]);

  useLayoutEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(DARK_MODE_QUERY);
    const onChange = () => {
      if (themeRef.current !== "system") return;
      const nextTheme = getSystemTheme();
      setSystemTheme(nextTheme);
      applyResolvedTheme(nextTheme);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {(theme === "deep-sky" || theme === "light-sky") && <div className="deep-sky-backdrop" aria-hidden="true" />}
      {resolvedTheme === "light" && theme !== "light-sky" && <div className="daylight-backdrop" aria-hidden="true" />}
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme requires a ThemeProvider");
  return context;
}
