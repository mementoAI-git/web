import { getProfileAvatarUrl } from "@/utility/profile-avatar";
import type { ReactNode } from "react";
import { useState } from "react";
import { themeOptions } from "@/components/theme-options";
import { bottomSheetClass } from "@/components/ui/bottom-sheet-class";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTheme } from "@/contexts/theme";
import type { ThemePreference } from "@/lib/theme";
import { UserAvatar } from "@/components/user-avatar";
import { useSubscription } from "@/contexts/subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { cn } from "@/utility";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  ChevronsUpDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  Twitter,
  UsersRound,
  X,
} from "lucide-react";

const CONTACT_URL = "https://tally.so/r/kdb0Jj";
const X_URL = "https://x.com/MementoAI";
const DISCORD_URL = "https://discord.gg/RzR7xJSwYg";

const lucideItemIcon = "shrink-0 text-v3-text-strong";

const itemRowClass =
  "flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-0.5 font-inter text-v3-text-strong outline-none data-[focused]:bg-v3-fill-weaker";

const itemLabelClass = "flex-1 text-left text-[13px]";

export function ProfileDropdown({
  hideName = false,
  subtitle,
  contentClassName,
}: {
  hideName?: boolean;
  subtitle?: string;
  contentClassName?: string;
}) {
  const { user, unsetAuth } = useStore();
  const { tier, isLoading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const rawName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const photo = getProfileAvatarUrl(user);

  const planLabel = !subscriptionLoading
    ? tier === "pro" || tier === "legacy"
      ? "Pro"
      : "Free"
    : null;

  const isMobile = useIsMobile();

  const handleLogout = () => {
    unsetAuth?.();
    navigate("/login");
  };

  const triggerClassName = cn(
    "flex w-full items-center gap-2 rounded-xl bg-fill-neutral-weak px-2 py-2 outline-none",
    "transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-fill-neutral-weak active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
  );

  const triggerContent = (
    <>
      <span aria-hidden className="inline-flex shrink-0">
        <UserAvatar
          alt=""
          src={!isEmpty(photo) ? photo : undefined}
          name={rawName || undefined}
          email={user?.email}
          userId={user?._id}
          size="lg"
          className="!rounded-full"
        />
      </span>
      {!hideName && (
        <div className="flex w-full min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0 text-left">
            <span className="w-full truncate font-inter text-sm font-semibold text-foreground">
              {user?.first_name ?? "User"}
            </span>
            {(subtitle ?? planLabel) != null ? (
              <span className="font-inter text-xs font-normal text-muted-foreground">
                {subtitle ?? planLabel}
              </span>
            ) : null}
          </div>
          <ChevronsUpDown
            className="shrink-0 text-muted-foreground"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <AccountSheet
        triggerClassName={triggerClassName}
        triggerContent={triggerContent}
        onSettings={() => navigate("/settings")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClassName}>
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        aria-label="Account menu"
        className={cn(
          "navigation-menu min-w-[260px] gap-0 rounded-xl border border-border bg-popover p-1",
          "shadow-xl",
          contentClassName,
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

const sheetGroupClass =
  "mb-4 flex flex-col overflow-hidden rounded-2xl bg-fill-neutral-weak";

const sheetRowClass =
  "flex min-h-[52px] w-full items-center gap-3.5 px-4 py-3.5 text-left font-inter text-[15px] leading-[23px] text-text-neutral-strong transition-colors active:bg-fill-neutral-weaker [&:not(:first-child)]:border-t [&:not(:first-child)]:border-stroke-neutral-weaker";

const sheetIconClass = "size-5 shrink-0 text-text-neutral-weak";

/** Phones open the account menu as the standard bottom sheet instead of a popover. */
function AccountSheet({
  triggerClassName,
  triggerContent,
  onSettings,
  onLogout,
}: {
  triggerClassName: string;
  triggerContent: ReactNode;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerContent}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(bottomSheetClass, "px-5 pt-5")}
        >
          <SheetDescription className="sr-only">
            Settings, appearance, help and community links.
          </SheetDescription>
          <div className="pb-2">
            <div className="mb-5 flex items-center justify-between px-0.5">
              <SheetTitle className="font-garamond text-[22px] font-normal leading-7 text-text-neutral-strong">
                Account
              </SheetTitle>
              <button
                type="button"
                aria-label="Close account menu"
                onClick={() => setOpen(false)}
                className="flex size-11 items-center justify-center rounded-full bg-fill-neutral-weak text-text-neutral-weak"
              >
                <X className="size-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            <div className={sheetGroupClass}>
              <button type="button" onClick={run(onSettings)} className={sheetRowClass}>
                <Settings className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                Settings
              </button>
              <button type="button" onClick={run(onLogout)} className={sheetRowClass}>
                <LogOut className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                Log out
              </button>
            </div>

            <p
              id="account-sheet-appearance"
              className="mb-2 px-0.5 font-inter text-[13px] leading-5 text-text-neutral-weak"
            >
              Appearance
            </p>
            <div
              role="radiogroup"
              aria-labelledby="account-sheet-appearance"
              className={sheetGroupClass}
            >
              {themeOptions.map(({ value, label, Icon }) => {
                const selected = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(value as ThemePreference)}
                    className={sheetRowClass}
                  >
                    <Icon className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{label}</span>
                    {selected && (
                      <Check className="size-5 shrink-0 text-text-brand-strong" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            <div className={sheetGroupClass}>
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={sheetRowClass}
              >
                <CircleHelp className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                <span className="flex-1">Contact us</span>
                <ChevronRight className="size-4 shrink-0 text-text-neutral-weak" strokeWidth={2} aria-hidden />
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={sheetRowClass}
              >
                <Twitter className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                Follow Us
              </a>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={sheetRowClass}
              >
                <UsersRound className={sheetIconClass} strokeWidth={1.8} aria-hidden />
                Join Community
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
