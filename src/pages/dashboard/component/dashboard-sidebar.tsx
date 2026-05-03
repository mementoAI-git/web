import { useLocation } from "react-router-dom";
import { PanelLeftClose } from "lucide-react";
import { topNavigations, bottomNavigations } from "./navigation";
import SideBarItem from "./sidebar-item";
import { ProfileDropdown } from "./profile-dropdown";
import { SidebarUpgradeCard } from "./sidebar-upgrade-card";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { isFeatureFlagAdminUser } from "@/contexts/feature-flags";
import { cn } from "@/utility";

interface DashboardSideBarProps {
  onClose?: () => void;
  /** Collapse the desktop rail or close the mobile drawer */
  onCollapse?: () => void;
}

const sidebarChromeBtn =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white text-text-neutral-strong transition-colors hover:bg-fill-neutral-weaker focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2";

export function DashboardSideBar({ onClose, onCollapse }: DashboardSideBarProps) {
  const location = useLocation();
  const { open } = useModal();
  const { user } = useStore();
  const showAdminFlags = isFeatureFlagAdminUser(user?.email);

  const pathname = location.pathname;

  return (
    <div className="dynamic-height w-full min-h-screen overflow-x-hidden bg-white border-r border-black/5 flex flex-col">
      <div className="flex items-center gap-2 p-4">
        <div className="min-w-0 flex-1">
          <ProfileDropdown />
        </div>
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            className={cn(sidebarChromeBtn)}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-4 px-4 flex flex-col gap-1">
        {topNavigations.map((n, i) => (
          <SideBarItem
            {...n}
            active={
              n.link === pathname ||
              pathname.includes(n.link) ||
              (n.link === "/overview" && pathname === "/")
            }
            key={i}
            onClick={onClose}
          />
        ))}
      </div>

      <div className="mt-auto px-4 pb-6 flex flex-col gap-1">
        <div className="h-px w-full my-4" />
        {bottomNavigations.map((n, i) => (
          <SideBarItem
            {...n}
            active={pathname.includes(n.link)}
            key={i}
            onClick={onClose}
          />
        ))}
        {showAdminFlags ? (
          <SideBarItem
            emoji="⚙️"
            title="Feature flags"
            link="/admin/feature-flags"
            active={pathname.startsWith("/admin/feature-flags")}
            onClick={onClose}
          />
        ) : null}
        <SideBarItem
          emoji="📝"
          title="Drop feedback"
          onClick={() => {
            open("create-feedback");
            onClose?.();
          }}
        />
        <div className="mt-4 flex shrink-0 flex-col">
          <SidebarUpgradeCard onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
