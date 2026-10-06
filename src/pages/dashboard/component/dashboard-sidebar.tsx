import type { CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { topNavigations, bottomNavigations } from "./navigation";
import SideBarItem from "./sidebar-item";
import { ProfileDropdown } from "./profile-dropdown";
import Logo from "@/components/logo";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ChartNoAxesCombined, PanelLeftClose, UsersRound } from "lucide-react";
import hourglassIcon from "@/assets/icon/sidebar/hourglass.svg";
import linkIcon from "@/assets/icon/sidebar/link.svg";
import lightBulbIcon from "@/assets/icon/sidebar/light-bulb.svg";
import upArrowIcon from "@/assets/icon/sidebar/up-arrow.svg";
type DashboardSideBarProps = {
  onCollapse?: () => void;
};

export function DashboardSideBar({ onCollapse }: DashboardSideBarProps) {
  const location = useLocation();
  const { open } = useModal();

  const pathname = location.pathname;

  return (
    <SidebarProvider
      className="h-full min-h-0"
      style={{ "--sidebar-width": "100%" } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        className="dynamic-height min-h-screen bg-bg-overview-sidebar"
      >
        <SidebarHeader className="flex-row items-center justify-between pb-3 pl-7 pr-4 pt-6">
          <Logo className="text-[24px] font-normal leading-9 text-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="rounded-lg active:scale-[0.97]"
          >
            <PanelLeftClose
              data-icon="inline-start"
              className="text-icon-neutral-weak"
              aria-hidden
            />
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-4 py-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {topNavigations.map((navigation) => (
                  <SideBarItem
                    {...navigation}
                    active={
                      navigation.link === pathname ||
                      pathname.startsWith(`${navigation.link}/`) ||
                      (navigation.link === "/overview" && pathname === "/")
                    }
                    key={navigation.link}
                  />
                ))}
                <SideBarItem
                  icon={hourglassIcon}
                  title="Time capsule"
                  link="/capsule"
                />
                <SideBarItem
                  Icon={ChartNoAxesCombined}
                  title="Insights"
                  onClick={() => open("memory-insights")}
                />
                <SideBarItem
                  Icon={UsersRound}
                  title="People"
                  link="/settings/beneficiary"
                  active={pathname.startsWith("/settings/beneficiary")}
                />
                {bottomNavigations.map((navigation) => (
                  <SideBarItem
                    {...navigation}
                    active={
                      (pathname === navigation.link ||
                        pathname.startsWith(`${navigation.link}/`)) &&
                      !pathname.startsWith("/settings/beneficiary")
                    }
                    key={navigation.link}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-0 p-0">
          <SidebarSeparator className="mx-0" />
          <SidebarGroup className="px-4 pb-2 pt-8">
            <SidebarGroupContent>
              <SidebarMenu>
                <SideBarItem
                  icon={linkIcon}
                  title="Invite friends"
                  link="/settings/beneficiary"
                  active={pathname.startsWith("/settings/beneficiary")}
                />
                <SideBarItem
                  icon={lightBulbIcon}
                  title="Feedback"
                  onClick={() => {
                    open("create-feedback");
                  }}
                />
                <SideBarItem
                  icon={upArrowIcon}
                  title="Upgrade plan"
                  tone="brand"
                  link="/pricing"
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="px-4 pb-8">
            <ProfileDropdown subtitle="Host user" />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
