import { useTheme } from "@/contexts/theme";
import SunLight from "@/assets/image/overview/design/sun-light.svg?react";
import SunDark from "@/assets/image/overview/design/sun-dark.svg?react";
import ToolsLight from "@/assets/image/overview/design/tools-light.svg?react";
import ToolsDark from "@/assets/image/overview/design/tools-dark.svg?react";
import StreakLight from "@/assets/image/overview/design/streak-light.svg?react";
import StreakDark from "@/assets/image/overview/design/streak-dark.svg?react";
import story from "@/assets/image/overview/design/story.svg";
import phone from "@/assets/image/overview/design/phone.svg";
import microphone from "@/assets/image/overview/design/microphone.svg";

const themedIcons = {
  sun: { light: SunLight, dark: SunDark },
  tools: { light: ToolsLight, dark: ToolsDark },
  streak: { light: StreakLight, dark: StreakDark },
};
const monochromeIcons = { story, phone, microphone };

/** Original Figma icon geometry and duotone colours, with theme-specific exports. */
export function OverviewDesignIcon({ name, alt = "" }: {
  name: keyof typeof themedIcons | keyof typeof monochromeIcons;
  alt?: string;
}) {
  const { resolvedTheme } = useTheme();
  if (name in themedIcons) {
    const Icon = themedIcons[name as keyof typeof themedIcons][resolvedTheme];
    return <Icon
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className="size-5 shrink-0"
    />;
  }
  return <span aria-hidden className="inline-block size-5 shrink-0 bg-current" style={{
    maskImage: `url("${monochromeIcons[name as keyof typeof monochromeIcons]}")`,
    maskSize: "20px 20px", maskRepeat: "no-repeat", maskPosition: "center",
  }} />;
}
