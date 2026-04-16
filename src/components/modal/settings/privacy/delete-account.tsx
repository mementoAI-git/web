import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useLogout } from "@/hooks/use-logout";
import { toast } from "sonner";
import { DeletePromptModal } from "../../delete-prompt-modal";

interface DeleteAccountProps {
  close: () => void;
  open: boolean;
}

export default function DeleteAccount({ close, open }: DeleteAccountProps) {
  const { trigger: deleteAccount, isMutating: deletingAccount } = useFetcher(
    endpoint.deleteAccount,
    "delete",
  );
  const { logout, loading: logoutLoading } = useLogout();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount({});
      await logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(message);
    }
  };

  const busy = deletingAccount || logoutLoading;

  return (
    <div className={`modal-overlay !z-[200] bg-overlay-backdrop ${open ? "flex" : "hidden"}`}>
      <div className="flex h-full w-full items-center justify-center p-4">
        <DeletePromptModal
          onClose={close}
          title="Delete account?"
          description="Are you sure you want to delete your account? Deleting your account is permanent and there is no way of recovering your data once deleted."
          confirmLabel="I understand, delete"
          onConfirm={handleDeleteAccount}
          loading={busy}
        />
      </div>
    </div>
  );
}
