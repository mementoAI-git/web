import { UserAvatar } from "@/components/user-avatar";
import { useSubscription } from "@/contexts/subscription";
import { useTheme } from "@/contexts/theme";
import { useStore } from "@/hooks/use-store";
import { isThemePreference, type ThemePreference } from "@/lib/theme";
import { isEmpty } from "@/utility";
import { cn } from "@/utility";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  SunMoon,
  Twitter,
  UsersRound,
} from "lucide-react";

const CONTACT_URL = "https://tally.so/r/kdb0Jj";
const X_URL = "https://x.com/MementoAI";
const DISCORD_URL = "https://discord.gg/RzR7xJSwYg";

const lucideItemIcon = "shrink-0 text-v3-text-strong";

const itemRowClass =
  "flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-0.5 font-inter text-v3-text-strong outline-none data-[focused]:bg-v3-fill-weaker";

const itemLabelClass = "flex-1 text-left text-[13px]";

export function ProfileDropdown({ hideName = false }: { hideName?: boolean }) {
  const { user, unsetAuth } = useStore();
  const { tier, isLoading: subscriptionLoading } = useSubscription();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const rawName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const photo = user?.picture_url || user?.picture;

  const planLabel = !subscriptionLoading
    ? tier === "pro" || tier === "legacy"
      ? "Pro"
      : "Free"
    : null;

  const handleLogout = () => {
    unsetAuth?.();
    navigate("/login");
  };

  const handleThemeChange = (value: string) => {
    if (isThemePreference(value)) setTheme(value satisfies ThemePreference);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg bg-transparent px-2 py-1 outline-none transition-colors",
          "hover:bg-v3-fill-weak",
          "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
        )}
      >
        <span aria-hidden className="inline-flex shrink-0">
          <UserAvatar
            alt=""
            src={!isEmpty(photo) ? photo : undefined}
            name={rawName || undefined}
            email={user?.email}
            size="lg"
            className="!rounded-full"
          />
        </span>
        {!hideName && (
          <div className="flex w-full min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0 text-left">
              <span className="flex w-full min-w-0 items-center gap-1">
                <span className="w-full truncate font-inter text-sm font-semibold text-foreground">
                  {user?.first_name ?? "User"}
                </span>
                <ChevronDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
              {planLabel != null ? (
                <span className="font-inter text-xs font-normal text-muted-foreground">
                  {planLabel}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        aria-label="Account menu"
        className={cn(
          "min-w-[260px] gap-0 rounded-xl border border-border bg-popover p-1",
          "shadow-xl",
        )}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className={itemRowClass}
          >
            <Settings className={lucideItemIcon} strokeWidth={2} />
            <span className={itemLabelClass}>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={itemRowClass}>
              <SunMoon className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent aria-label="Theme options">
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={handleThemeChange}
              >
                <DropdownMenuRadioItem value="light" className={itemRowClass}>
                  <Sun className={lucideItemIcon} strokeWidth={2} />
                  <span className={itemLabelClass}>Light</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className={itemRowClass}>
                  <Moon className={lucideItemIcon} strokeWidth={2} />
                  <span className={itemLabelClass}>Dark</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" className={itemRowClass}>
                  <Monitor className={lucideItemIcon} strokeWidth={2} />
                  <span className={itemLabelClass}>System</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={handleLogout} className={itemRowClass}>
            <LogOut className={lucideItemIcon} strokeWidth={2} />
            <span className={itemLabelClass}>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1 bg-v3-stroke-weak" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className={itemRowClass}>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              <CircleHelp className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Contact us</span>
              <ChevronRight
                className="shrink-0 text-v3-text-weak"
                strokeWidth={2}
                aria-hidden
              />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1 bg-v3-stroke-weak" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className={itemRowClass}>
            <a href={X_URL} target="_blank" rel="noopener noreferrer">
              <Twitter className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Follow Us</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={itemRowClass}>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              <UsersRound className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Join Community</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
