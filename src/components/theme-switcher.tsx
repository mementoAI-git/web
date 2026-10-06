import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher({ className, lightIcon }: { className?: string; lightIcon?: ReactNode } = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "light" ? Sun : Moon;
  const label = `Switch to ${nextTheme} mode`;

  return (
    <Button
      className={className}
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
    >
      {nextTheme === "light" && lightIcon ? lightIcon : <Icon aria-hidden="true" />}
    </Button>
  );
}
