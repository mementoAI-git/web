import Image from "next/image";
import avatar from "@/public/image/avatar.png"
import { DropdowmIcon } from "@/components/Dropdown";
import LogoutIcon from "@/public/icon/logout.svg";
import UserCircleIcon from "@/public/icon/user-circle.svg";
import { useStore } from "@/hooks/use-store";
import { useRouter } from "next/navigation";

export function ProfileDropdown() {
  const { user, unsetAuth } = useStore()
  const router = useRouter()

  const handleSelect = (value: string) => {
    if (value === "profile") {
      router.push("/settings/profile")
    }
  }

  const handleLogout = () => {
    unsetAuth()
    router.push("/login")
  }

  return (
    <DropdowmIcon
      items={[
        {
          label: "My Profile",
          value: "profile",
          startIcon: <UserCircleIcon strokeWidth={2} width={16} size={16} />
        }
      ]}
      onSelect={handleSelect}
      footerItem={
        <li
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <LogoutIcon width={16} size={16} />
          <span className="font-inter text-sm">Logout</span>
        </li>
      }
    >
      <div className="px-4 py-2.5 flex items-center gap-2 justify-center">
        <Image src={avatar} alt="Avatar" className="size-5 object-contain" />
        <span className="font-inter font-semibold text-sm text-gray-800">{user?.first_name}</span>
      </div>
    </DropdowmIcon>
  )
}