import avatar from "@/assets/image/avatar.png";
import { DropdownIcon } from "@/components/Dropdown";
import { useStore } from "@/hooks/use-store";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  LogoutIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { useModal } from "@/hooks/use-modal";

export function ProfileDropdown({ hideName = false }: { hideName?: boolean }) {
  const { user, unsetAuth } = useStore();
  const navigate = useNavigate();
  const { open } = useModal();

  const handleSelect = (value: string) => {
    if (value === "profile") {
      open("settings");
    }
  };

  const handleLogout = () => {
    unsetAuth?.();
    navigate("/login");
  };

  return (
    <div>
      <DropdownIcon
        items={[
          {
            label: "My Profile",
            value: "profile",
            startIcon: <UserCircleIcon strokeWidth={2} width={16} />,
          },
        ]}
        onSelect={handleSelect}
        footerItem={
          <li
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
          >
            <LogoutIcon width={16} />
            <span className="font-inter text-sm">Logout</span>
          </li>
        }
      >
        <div className="px-4 py-2.5 flex items-center gap-2 justify-center">
          <img src={avatar} alt="Avatar" className="size-5 object-contain" />
          {!hideName && (
            <>
              <span className="font-inter font-semibold text-sm text-gray-800">
                {user?.first_name ?? "User"}
              </span>
              <ChevronDownIcon className="size-3.5 text-gray-400" />
            </>
          )}
        </div>
      </DropdownIcon>
    </div>
  );
}
