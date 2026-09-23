import { useLocation } from "react-router-dom";
import { topNavigations, bottomNavigations } from "./navigation";
import SideBarItem from "./sidebar-item";
import { ProfileDropdown } from "./profile-dropdown";
import { SidebarUpgradeCard } from "./sidebar-upgrade-card";
import Logo from "@/components/logo";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { isFeatureFlagAdminUser } from "@/contexts/feature-flags";

export function DashboardSideBar() {
  const location = useLocation();
  const { open } = useModal();
  const { user } = useStore();
  const showAdminFlags = isFeatureFlagAdminUser(user?.email);

  const pathname = location.pathname;

  return (
    <div className="dynamic-height w-full min-h-screen overflow-x-hidden bg-card border-r border-border flex flex-col">
      <div className="flex items-center p-4">
        <Logo className="text-[28px] leading-[34px] text-foreground" />
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
          />
        ))}
      </div>

      <div className="mt-auto px-4 pb-6 flex flex-col gap-1">
        <div className="h-px w-full my-4" />
        {bottomNavigations.map((n, i) => (
          <SideBarItem {...n} active={pathname.includes(n.link)} key={i} />
        ))}
        {showAdminFlags ? (
          <SideBarItem
            emoji="⚙️"
            title="Feature flags"
            link="/admin/feature-flags"
            active={pathname.startsWith("/admin/feature-flags")}
          />
        ) : null}
        <SideBarItem
          emoji="📝"
          title="Drop feedback"
          onClick={() => {
            open("create-feedback");
          }}
        />
        <div className="mt-4 flex w-full min-w-0 shrink-0 flex-col">
          <SidebarUpgradeCard />
        </div>
        <div className="mt-4 min-w-0">
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
