import avatar from "@/assets/image/avatar.png";
import { DropdowmIcon } from "@/components/Dropdown";
import { useStore } from "@/hooks/use-store";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon, LogoutIcon } from "@/components/icons";

export function ProfileDropdown() {
  const { user, unsetAuth } = useStore();
  const navigate = useNavigate();

  const handleSelect = (value: string) => {
    if (value === "profile") {
      navigate("/settings/profile");
    }
  };

  const handleLogout = () => {
    unsetAuth?.();
    navigate("/login");
  };

  return (
    <div>
      <DropdowmIcon
        items={[
          {
            label: "My Profile",
            value: "profile",
            startIcon: <UserCircleIcon strokeWidth={2} width={16} />
          }
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
          <span className="font-inter font-semibold text-sm text-gray-800">{user?.first_name ?? "User"}</span>
        </div>
      </DropdowmIcon>
    </div>
  );
}