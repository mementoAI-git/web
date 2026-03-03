"use client";

import { Textinput } from "@/components/Form";
import { ModalCloseBtn } from "../modalLayout";
import useForm from "@/hooks/use-form";
import * as yup from "yup";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";

const schema = yup.object().shape({
  name: yup.string().required("Name is required").max(120, "Max 120 characters").trim(),
  description: yup.string().max(500, "Max 500 characters").trim(),
});

export function AddGroup() {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.groups, "post");
  const { handleSubmit, isValid, getField } = useForm({
    initial: { name: "", description: "" },
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result?.success && result?.data) {
        await mutate((key) => typeof key === "string" && key.startsWith("/groups"));
        toast.success(result?.message ?? "Group created");
        close?.("add-group");
      }
    },
  });

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close?.("add-group")} />
      <div className="space-y-6">
        <h4 className="modal-title">Create group</h4>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textinput
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Group name</span>}
            inputClassName="!h-[50px]"
            {...getField("name")}
            placeholder="e.g. Family"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <Textinput
            label={<span className="font-inter text-sm font-normal text-gray-950/70">Description (optional)</span>}
            inputClassName="!h-[50px]"
            {...getField("description")}
            placeholder="Short description"
            labelClassName="!text-[rgba(0,9,51,0.65)] !text-xs !font-normal"
          />
          <div className="flex w-full items-center justify-end gap-4">
            <button type="button" onClick={() => close?.("add-group")} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={isMutating || !isValid} className="btn">
              <span>Create group</span>
              <Spinner className="!size-4" loading={isMutating} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}