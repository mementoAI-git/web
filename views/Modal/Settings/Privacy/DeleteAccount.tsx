import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useFetcher from "@/hooks/use-fetcher";
import Spinner from "@/components/Spinner";
import { useLogout } from "@/hooks/use-logout";
import { toast } from "sonner";

interface DeleteAccountProps {
  close: () => void;
  open: boolean;
}

export default function DeleteAccount({ close, open }: DeleteAccountProps) {
  const { trigger: deleteAccount, isMutating: deletingAccount } = useFetcher(endpoint.deleteAccount, "delete");
  const { logout, loading: logoutLoading } = useLogout();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount({});
      logout();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete account");
    }
  };
  return (
    <div className={`modal-overlay !z-[200] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="modal-container !max-w-120">
          <ModalCloseBtn onClick={close} />
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="modal-title text-gray-950/90 !font-garamond !font-medium">Delete account?</h4>
              <span className="text-gray-950/70 text-base font-inter">
                Are you sure you want to delete your account? deleting your account is permanent and there is no way of recovering your data once deleted
              </span>
            </div>
            <div className="flex justify-end items-center gap-4">
              <button
                className="cursor-pointer px-4 py-2.5 bg-white/1 border border-[#0011661A] rounded-full h-10 font-inter font-semibold text-sm shadow"
                onClick={close}
              >Cancel</button>
              <button
                disabled={deletingAccount || logoutLoading}
                onClick={handleDeleteAccount}
                className=" flex px-4 py-2.5 items-center gap-2 justify-center cursor-pointer bg-danger text-white rounded-full h-10 font-inter font-semibold text-sm"
              >
                I understand, delete
                <Spinner loading={deletingAccount || logoutLoading} className="!size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}