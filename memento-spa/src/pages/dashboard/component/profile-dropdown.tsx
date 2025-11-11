import avatar from "@/assets/image/avatar.png";
import logoutIcon from "@/assets/icon/logout.svg?url";
import userCircleIcon from "@/assets/icon/user-circle.svg?url";
import { DropdowmIcon } from "@/components/Dropdown";
import { useStore } from "@/hooks/use-store";
import { useNavigate } from "react-router-dom";

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
    <DropdowmIcon
      items={[
        {
          label: "My Profile",
          value: "profile",
          startIcon: <img src={userCircleIcon} alt="Profile" className="size-4" />,
        },
      ]}
      onSelect={handleSelect}
      footerItem={
        <li
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-[#F97066] hover:bg-[#F97066]/8"
        >
          <img src={logoutIcon} alt="Logout" className="size-4" />
          <span className="font-inter text-sm">Logout</span>
        </li>
      }
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2.5">
        <img src={avatar} alt="Avatar" className="size-5 rounded-full object-cover" />
        <span className="font-inter text-sm font-semibold text-gray-800">
          {user?.first_name ?? "User"}
        </span>
      </div>
    </DropdowmIcon>
  );
}