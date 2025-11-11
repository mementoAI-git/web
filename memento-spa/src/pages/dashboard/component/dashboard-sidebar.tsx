
import { SlideIcon } from "@/components/icons";
import Logo from "@/components/logo";
import { useModal } from "@/hooks/use-modal";
import { useLocation, useNavigate } from "react-router-dom";
import { bottomNavigations, topNavigations } from "./navigation";
import SideBarItem from "./sidebar-item";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useModal();

  const pathname = location.pathname;

  const handleLogoClick = () => {
    navigate("/overview");
    onClose?.();
  };

  return (
    <div className="dynamic-height w-full min-h-screen overflow-x-hidden border-r border-gray-200 bg-background">
      <div className="flex size-full max-h-300 flex-col justify-between">
        <div className="w-full">
          <div className="flex items-center justify-between p-5 pl-6">
            <button type="button" onClick={handleLogoClick} className="cursor-pointer">
              <Logo />
            </button>
          </div>
          <div className="flex flex-col gap-1 px-4 py-4 sm:gap-2 md:py-8">
            {topNavigations.map((nav) => (
              <SideBarItem
                key={nav.title}
                {...nav}
                active={pathname === nav.link || pathname.startsWith(`${nav.link}/`)}
                onClick={onClose}
              />
            ))}
            <SideBarItem
              Icon={SlideIcon}
              active={pathname.includes("settings")}
              title="settings"
              onClick={() => open?.("settings")}
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-1 px-4 py-8 sm:gap-2">
          {bottomNavigations.map((nav) => (
            <SideBarItem
              key={nav.title}
              {...nav}
              active={pathname === nav.link}
              onClick={onClose}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
