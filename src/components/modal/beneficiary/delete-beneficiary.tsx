import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteBeneficiaryProps {
  data: string;
}

export function DeleteBeneficiary({ data: id }: DeleteBeneficiaryProps) {
  const { trigger, isMutating } = useFetcher(
    resolvePath(endpoint.beneficiary, { id }),
    "delete",
  );
  const { close } = useModal();

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.data) {
      await mutate(SETTINGS_BENEFICIARIES_SWR_KEY);
      toast.success(result?.message);
      close?.("delete-beneficiary");
    }
  };

  return (
    <DeletePromptModal
      onClose={() => close?.("delete-beneficiary")}
      title="Remove beneficiary"
      description={
        <>
          <p>This action cannot be undone.</p>
          <p className="mt-3">
            Are you sure you want to remove this beneficiary? They will lose access to your Memento.
          </p>
        </>
      }
      confirmLabel="Remove"
      onConfirm={handleDelete}
      loading={isMutating}
    />
  );
}
