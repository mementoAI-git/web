import { CloudMoon, Monitor, Moon, Sun } from "lucide-react";

/** The theme choices offered in the theme menu and the phone account sheet. */
export const themeOptions = [
  { value: "light-sky", label: "Light sky", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "deep-sky", label: "Deep sky", Icon: CloudMoon },
  { value: "system", label: "System", Icon: Monitor },
] as const;
