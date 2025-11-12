import { ModalCloseBtn } from "../../modalLayout";
import Spinner from "@/components/spinner";
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
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className={`modal-overlay !z-[200] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="modal-container !max-w-120">
          <ModalCloseBtn onClick={close} />
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="modal-title !font-garamond !font-medium text-gray-950/90">
                Logout from all devices?
              </h4>
              <span className="font-inter text-base text-gray-950/70">
                Are you sure you want to logout from all devices? You will need to log in again on all your devices.
              </span>
            </div>
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                className="h-10 cursor-pointer rounded-full border border-[#0011661A] bg-white/1 px-4 py-2.5 font-inter text-sm font-semibold shadow"
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={logoutLoading}
                onClick={handleLogoutAllDevices}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-danger px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                I understand, logout
                <Spinner loading={logoutLoading} className="!size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

