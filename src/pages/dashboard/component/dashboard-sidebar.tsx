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
import { PanelLeftClose } from "lucide-react";
import inviteFriendsIcon from "@/assets/icon/noto_link.svg";
import feedbackIcon from "@/assets/icon/noto_light-bulb.svg";
import upgradePlanIcon from "@/assets/icon/emojione_up-arrow.svg";

type DashboardSideBarProps = {
  onCollapse?: () => void;
};

export function DashboardSideBar({ onCollapse }: DashboardSideBarProps) {
  const location = useLocation();
  const { open } = useModal();

  const pathname = location.pathname;
  const primaryNavigations = [...topNavigations, ...bottomNavigations];

  return (
    <SidebarProvider
      className="h-full min-h-0"
      style={{ "--sidebar-width": "100%" } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        className="dynamic-height min-h-screen border-r border-stroke-neutral-weak"
      >
        <SidebarHeader className="flex-row items-center justify-between pb-5 pl-8 pr-4 pt-6">
          <Logo className="text-[24px] leading-8 text-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
            className="rounded-lg active:scale-[0.97]"
          >
            <PanelLeftClose data-icon="inline-start" aria-hidden />
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-5 py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNavigations.map((navigation) => (
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-0 p-0">
          <SidebarSeparator className="mx-0" />
          <SidebarGroup className="px-5 py-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SideBarItem
                  icon={inviteFriendsIcon}
                  title="Invite friends"
                  link="/settings/beneficiary"
                  active={pathname.startsWith("/settings/beneficiary")}
                />
                <SideBarItem
                  icon={feedbackIcon}
                  title="Feedback"
                  onClick={() => {
                    open("create-feedback");
                  }}
                />
                <SideBarItem
                  icon={upgradePlanIcon}
                  title="Upgrade plan"
                  link="/pricing"
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="px-5 pb-8">
            <ProfileDropdown subtitle="Host user" />
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
