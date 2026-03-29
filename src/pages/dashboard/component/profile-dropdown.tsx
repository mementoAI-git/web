import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { cn } from "@/utility";
import { useNavigate } from "react-router-dom";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownSection,
  DropdownTrigger,
  Separator,
} from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  Twitter,
  UsersRound,
} from "lucide-react";

const CONTACT_URL = "https://tally.so/r/kdb0Jj";
const X_URL = "https://x.com/MementoAI";
const DISCORD_URL = "https://discord.gg/RzR7xJSwYg";

const lucideItemIcon = "size-4 shrink-0 text-v3-text-strong";

const itemRowClass =
  "flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-0.5 font-inter text-v3-text-strong outline-none data-[focused]:bg-v3-fill-weaker";

const itemLabelClass = "flex-1 text-left text-[13px]";

export function ProfileDropdown({ hideName = false }: { hideName?: boolean }) {
  const { user, unsetAuth } = useStore();
  const navigate = useNavigate();
  const rawName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const photo = user?.picture_url || user?.picture;

  const handleLogout = () => {
    unsetAuth?.();
    navigate("/login");
  };

  return (
    <Dropdown>
      <DropdownTrigger
        type="button"
        className={cn(
          "flex items-center gap-2 rounded-lg bg-transparent px-4 py-2.5 outline-none transition-colors",
          "hover:bg-v3-fill-weak data-[pressed]:bg-v3-fill-weak",
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-v3-brand-strong data-[focus-visible]:ring-offset-2",
        )}
      >
        <span aria-hidden className="inline-flex shrink-0">
          <UserAvatar
            alt=""
            src={!isEmpty(photo) ? photo : undefined}
            name={rawName || undefined}
            email={user?.email}
            size="sm"
            className="!size-5 !rounded-full"
          />
        </span>
        {!hideName && (
          <>
            <span className="font-inter text-sm font-semibold text-gray-800">
              {user?.first_name ?? "User"}
            </span>
            <ChevronDown
              className="size-3.5 shrink-0 text-gray-400"
              strokeWidth={2}
              aria-hidden
            />
          </>
        )}
      </DropdownTrigger>
      <DropdownPopover
        placement="bottom start"
        offset={8}
        className={cn(
          "min-w-[260px] rounded-xl border border-v3-stroke-weak bg-white p-1",
          "shadow-[0px_4px_24px_rgba(23,11,0,0.08)]",
        )}
      >
        <DropdownMenu
          selectionMode="none"
          aria-label="Account menu"
          className="gap-0 outline-none"
        >
          <DropdownSection className="mb-0">
            <DropdownItem
              id="settings"
              textValue="Settings"
              onAction={() => navigate("/settings")}
              className={itemRowClass}
            >
              <Settings className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Settings</span>
            </DropdownItem>
            <DropdownItem
              id="logout"
              textValue="Log out"
              onAction={handleLogout}
              className={itemRowClass}
            >
              <LogOut className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Log out</span>
            </DropdownItem>
          </DropdownSection>
          <Separator className="my-1 bg-v3-stroke-weak" />
          <DropdownSection className="mb-0">
            <DropdownItem
              id="contact"
              textValue="Contact us"
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={itemRowClass}
            >
              <CircleHelp className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Contact us</span>
              <ChevronRight
                className="size-4 shrink-0 text-v3-text-weak"
                strokeWidth={2}
                aria-hidden
              />
            </DropdownItem>
          </DropdownSection>
          <Separator className="my-1 bg-v3-stroke-weak" />
          <DropdownSection className="mb-0">
            <DropdownItem
              id="follow-x"
              textValue="Follow Us"
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={itemRowClass}
            >
              <Twitter className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Follow Us</span>
            </DropdownItem>
            <DropdownItem
              id="discord"
              textValue="Join Community"
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={itemRowClass}
            >
              <UsersRound className={lucideItemIcon} strokeWidth={2} />
              <span className={itemLabelClass}>Join Community</span>
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </DropdownPopover>
    </Dropdown>
  );
}
