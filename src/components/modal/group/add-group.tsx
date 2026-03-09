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
import { cn } from "@/utility";
import { GROUP_COLORS } from "@/utility/constant";

const schema = yup.object().shape({
  name: yup.string().required("Name is required").max(120, "Max 120 characters").trim(),
  description: yup.string().max(500, "Max 500 characters").trim(),
  color: yup.number().min(0).max(6).optional(),
});

export function AddGroup() {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.groups, "post");
  const { handleSubmit, isValid, getField, values, handleValue } = useForm({
    initial: { name: "", description: "", color: 0 },
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
    <div className="modal-container !p-5 !max-w-[400px] !w-[400px]">
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
          <div>
            <span className="font-inter text-sm font-normal text-gray-950/70 block mb-2">Group color</span>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((colorClass, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleValue("color", index)}
                  title={`Color ${index + 1}`}
                  className={cn(
                    "flex items-center justify-center size-9 rounded-full border-2 transition-all",
                    colorClass,
                    (values.color ?? 0) === index ? "ring-2 ring-offset-2 ring-gray-500 scale-110" : "hover:scale-105"
                  )}
                >
                  {(values.color ?? 0) === index && (
                    <span className="text-[10px] font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
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