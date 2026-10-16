import type { ReactNode } from "react";
import { CloudMoon, CloudSun, Monitor, Moon, Sun } from "lucide-react";
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

const themes = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "light-sky", label: "Light sky", Icon: CloudSun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "deep-sky", label: "Deep sky", Icon: CloudMoon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeSwitcher({ className, contentClassName, lightIcon, darkIcon }: { className?: string; contentClassName?: string; lightIcon?: ReactNode; darkIcon?: ReactNode } = {}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const icon = theme === "deep-sky" ? <CloudMoon aria-hidden="true" />
    : theme === "light-sky" ? <CloudSun aria-hidden="true" />
    : resolvedTheme === "dark" ? (darkIcon ?? <Moon aria-hidden="true" />)
    : (lightIcon ?? <Sun aria-hidden="true" />);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} type="button" variant="ghost" size="icon-lg" aria-label="Choose theme" title="Choose theme">
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClassName}>
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemePreference)}>
          {themes.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
