import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { TrashIcon } from "@/components/icons";
import { resolvePath } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";

interface DeleteBeneficiaryProps {
  data: string;
}

export function DeleteBeneficiary({ data: id }: DeleteBeneficiaryProps) {
  const { trigger, isMutating } = useFetcher(resolvePath(endpoint.beneficiary, { id }), "delete");
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
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close?.("delete-beneficiary")} />
      <div className="flex size-12 items-center justify-center rounded-full bg-[#FEE4E2] text-danger">
        <TrashIcon width={18} height={20} />
      </div>
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Delete Beneficiary</h4>
          <span className="font-inter text-sm text-grey-600">
            Are you sure you want to delete this beneficiary? This action cannot be undone.
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button className="flex-1 cursor-pointer rounded-lg border border-[#0011661A] bg-white/1 py-2.5 text-sm font-semibold shadow">
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={handleDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Yes, Delete
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

