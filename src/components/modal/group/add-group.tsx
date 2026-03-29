"use client";

import { X } from "lucide-react";
import { Input, Button } from "@heroui/react";
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

const inputClassNames = {
  label: "!text-v3-text-weak !font-normal !text-xs pb-0.5",
  input: "font-inter text-sm text-v3-text-strong placeholder:text-v3-text-weaker",
  inputWrapper: "!rounded-lg border-v3-stroke-weak bg-white hover:border-v3-stroke-strong data-[focus=true]:border-v3-stroke-strong shadow-none",
};

export function AddGroup() {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.groups, "post");
  const { handleSubmit, isValid, getField, values, handleValue } = useForm({
    initial: { name: "", description: "", color: 0 },
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result?.success) {
        await mutate((key) => typeof key === "string" && key.startsWith("/groups"));
        toast.success(result?.message ?? "Group created");
        close?.("add-group");
      }
    },
  });

  const nameField = getField("name");
  const descriptionField = getField("description");

  return (
    <div className="modal-container !p-5 !max-w-[440px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Create group</h2>
          <p className="font-inter text-sm text-v3-text-weak">Organize your beneficiaries into a group.</p>
        </div>
        <button
          type="button"
          onClick={() => close?.("add-group")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Group name"
          variant="bordered"
          labelPlacement="outside"
          placeholder="e.g. Family"
          name={nameField.name}
          value={nameField.value}
          onChange={nameField.onChange}
          isInvalid={!!nameField.error}
          errorMessage={nameField.error}
          classNames={inputClassNames}
        />
        <Input
          label="Description (optional)"
          variant="bordered"
          labelPlacement="outside"
          placeholder="Short description"
          name={descriptionField.name}
          value={descriptionField.value}
          onChange={descriptionField.onChange}
          isInvalid={!!descriptionField.error}
          errorMessage={descriptionField.error}
          classNames={inputClassNames}
        />

        <div className="flex flex-col gap-2">
          <span className="font-inter text-xs text-v3-text-weak">Group color</span>
          <div className="flex flex-wrap gap-2">
            {GROUP_COLORS.map((colorClass, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleValue("color", index)}
                title={`Color ${index + 1}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                  colorClass,
                  (values.color ?? 0) === index
                    ? "ring-2 ring-offset-2 ring-v3-stroke-strong scale-110"
                    : "hover:scale-105",
                )}
              >
                {(values.color ?? 0) === index && (
                  <span className="text-[10px] font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
          <Button
            type="button"
            variant="bordered"
            size="sm"
            className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
            onPress={() => close?.("add-group")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isDisabled={isMutating || !isValid}
            className="h-9 rounded-full bg-v3-fill-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isMutating ? (
              <span className="flex items-center gap-2">
                Creating… <Spinner className="!size-4" loading />
              </span>
            ) : (
              "Create group"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
