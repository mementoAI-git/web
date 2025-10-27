
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import { useLogout } from "@/hooks/use-logout";
import { toast } from "sonner";

interface LogoutAccountProps {
  close: () => void;
  open: boolean;
}

export default function LogoutAccount({ close, open }: LogoutAccountProps) {
  const { logout, loading: logoutLoading } = useLogout();

  const handleLogoutAllDevices = async () => {
    try {
      await logout();
      toast.success("Logged out of all devices");
    } catch (error: any) {
      toast.error("Failed to logout");
    }
  };
  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="modal-container !max-w-120">
          <ModalCloseBtn onClick={close} />
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="modal-title text-gray-950/90 !font-garamond !font-medium">Logout from all devices?</h4>
              <span className="text-gray-950/70 text-base font-inter">
                Are you sure you want to logout from all devices? you will need to log in again on all your devices.
              </span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <button
                className="cursor-pointer px-4 py-2.5 bg-white/1 border border-[#0011661A] rounded-full h-10 font-inter font-semibold text-sm shadow"
                onClick={close}
              >Cancel</button>
              <button
                disabled={logoutLoading}
                onClick={handleLogoutAllDevices}
                className=" flex px-4 py-2.5 items-center gap-2 justify-center cursor-pointer bg-danger text-white rounded-full h-10 font-inter font-semibold text-sm"
              >
                I understand, logout
                <Spinner loading={logoutLoading} className="!size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}