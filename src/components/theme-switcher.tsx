import type { ReactNode } from "react";
import { CloudMoon, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme";
import type { ThemePreference } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeOptions } from "@/components/theme-options";

/** The theme choices, for use inside a dropdown menu. */
export function ThemeMenuItems({ keepOpen = false }: { keepOpen?: boolean } = {}) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemePreference)}>
        {themeOptions.map(({ value, label, Icon }) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            onSelect={keepOpen ? (event) => event.preventDefault() : undefined}
          >
            <Icon aria-hidden="true" />
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

export function ThemeSwitcher({ className, contentClassName, lightIcon, darkIcon, renderTrigger }: {
  className?: string;
  contentClassName?: string;
  lightIcon?: ReactNode;
  darkIcon?: ReactNode;
  /** Replaces the icon button, for menus that show the theme as a labelled row. */
  renderTrigger?: (currentLabel: string) => ReactNode;
} = {}) {
  const { theme, resolvedTheme } = useTheme();
  const icon = theme === "deep-sky" ? <CloudMoon aria-hidden="true" />
    : resolvedTheme === "dark" ? (darkIcon ?? <Moon aria-hidden="true" />)
    : (lightIcon ?? <Sun aria-hidden="true" />);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {renderTrigger ? renderTrigger(themeOptions.find(({ value }) => value === theme)?.label ?? "System") : (
          <Button className={className} type="button" variant="ghost" size="icon-lg" aria-label="Choose theme" title="Choose theme">
            {icon}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
