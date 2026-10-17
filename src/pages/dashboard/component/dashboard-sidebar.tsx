import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { PanelLeftClose } from "lucide-react";
import linkIcon from "@/assets/icon/sidebar/link.svg";
import lightBulbIcon from "@/assets/icon/sidebar/light-bulb.svg";
import upArrowIcon from "@/assets/icon/sidebar/up-arrow.svg";
type DashboardSideBarProps = {
  onCollapse?: () => void;
  compact?: boolean;
};

export function DashboardSideBar({ onCollapse, compact = false }: DashboardSideBarProps) {
  const location = useLocation();
  const { open } = useModal();

  const pathname = location.pathname;

  return (
    <SidebarProvider
      className="navigation-sidebar-content h-full min-h-0"
      data-compact={compact}
      style={{ "--sidebar-width": "100%" } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        className="dynamic-height min-h-screen bg-bg-overview-sidebar"
      >
        <SidebarHeader className="flex-row items-center justify-between pb-3 pl-7 pr-4 pt-6">
          {compact ? <Link to="/overview" aria-label="Memento home" className="rounded-lg font-garamond text-3xl text-text-neutral-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-neutral-strong">M.</Link> : <Logo className="text-[24px] font-normal leading-9 text-foreground" />}
          {!compact && <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="navigation-button rounded-lg"
          >
            <PanelLeftClose
              data-icon="inline-start"
              className="text-icon-neutral-weak"
              aria-hidden
            />
          </Button>}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-4 py-3">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {topNavigations.map((navigation) => (
                  <SideBarItem
                    {...navigation}
                    active={
                      pathname.startsWith("/chat/reply/") ? navigation.link === "/explore" : navigation.link === pathname ||
                      pathname.startsWith(`${navigation.link}/`) ||
                      (navigation.link === "/overview" && pathname === "/")
                    }
                    key={navigation.link}
                  />
                ))}
                <SideBarItem
                  icon={lightBulbIcon}
                  title="Insights"
                  onClick={() => open("memory-insights")}
                />
                <SideBarItem
                  emoji="🫂"
                  title="People"
                  link="/people"
                  active={pathname === "/people" || pathname.startsWith("/people/")}
                />
                {bottomNavigations.map((navigation) => (
                  <SideBarItem
                    {...navigation}
                    active={
                      pathname === navigation.link ||
                      pathname.startsWith(`${navigation.link}/`)
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
                  onClick={() => open("invite-friends")}
                />
                <SideBarItem
                  emoji="📝"
                  title="Feedback"
                  onClick={() => {
                    open("create-feedback");
                  }}
                />
                <SideBarItem
                  icon={upArrowIcon}
                  title="Upgrade plan"
                  tone="brand"
                  onClick={() => {
                    open("pricing");
                  }}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className={compact ? "hidden" : "px-4 pb-8"}>
            <ProfileDropdown subtitle="Host user" />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
