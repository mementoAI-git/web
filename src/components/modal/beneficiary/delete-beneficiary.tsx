import endpoint from "@/api/endpoint";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
import { DeletePromptModal } from "../delete-prompt-modal";
import { isPeopleKey } from "@/api/people";

interface DeleteBeneficiaryProps {
  data: string | { id: string; mode: "connection" };
}

export function DeleteBeneficiary({ data }: DeleteBeneficiaryProps) {
  const id = typeof data === "string" ? data : data.id;
  const isConnection = typeof data !== "string";
  const { trigger, isMutating } = useGuardedModalFetcher(
    "delete-beneficiary",
    resolvePath(endpoint.beneficiary, { id }),
    "delete",
  );
  const { close } = useModal();

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.success) {
      void mutate(SETTINGS_BENEFICIARIES_SWR_KEY).catch(() => undefined);
      void mutate(isPeopleKey).catch(() => undefined);
      toast.success(result?.message);
      close?.("delete-beneficiary");
    }
  };

  return (
    <DeletePromptModal
      onClose={() => close?.("delete-beneficiary")}
      title={isConnection ? "Cancel invitation" : "Remove beneficiary"}
      description={
        <>
          <p>This action cannot be undone.</p>
          <p className="mt-3">
            {isConnection
              ? "Cancel this pending invitation? This person will no longer be able to accept it."
              : "Are you sure you want to remove this beneficiary? They will lose access to your Memento."}
          </p>
        </>
      }
      confirmLabel={isConnection ? "Cancel invitation" : "Remove"}
      onConfirm={handleDelete}
      loading={isMutating}
    />
  );
}
