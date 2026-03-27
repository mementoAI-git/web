import { useLocation } from "react-router-dom";
import { topNavigations, bottomNavigations } from "./navigation";
import SideBarItem from "./sidebar-item";
import { ProfileDropdown } from "./profile-dropdown";
import { useModal } from "@/hooks/use-modal";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const location = useLocation();
  const { open } = useModal();

  const pathname = location.pathname;

  return (
    <div className="dynamic-height w-full min-h-screen overflow-x-hidden bg-white border-r border-black/5 flex flex-col">
      <div className="p-4">
        <ProfileDropdown />
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
        <SideBarItem
          emoji="📝"
          title="Drop a feedback"
          onClick={() => {
            open("create-feedback");
            onClose?.();
          }}
        />
        {bottomNavigations.map((n, i) => (
          <SideBarItem
            {...n}
            active={pathname.includes(n.link)}
            key={i}
            onClick={onClose}
          />
        ))}
      </div>
    </div>
  );
}
