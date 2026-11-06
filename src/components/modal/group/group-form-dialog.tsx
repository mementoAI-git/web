"use client";

import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import * as yup from "yup";
import {
  FormDialog,
  FormDialogField,
  FormDialogFooter,
  FormDialogInput,
  FormDialogTextarea,
} from "@/components/modal/form-dialog";
import { GROUP_COLOR_PICKER, groupColorVar } from "@/components/group-color";
import useForm from "@/hooks/use-form";
import { cn } from "@/utility";

const schema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .max(120, "Max 120 characters")
    .trim(),
  description: yup.string().max(500, "Max 500 characters").trim(),
  color: yup.number().min(0).max(6).optional(),
});

export type GroupFormValues = {
  name: string;
  description: string;
  color: number;
};

export function GroupFormDialog({
  title,
  description,
  submitLabel,
  busyLabel,
  initial,
  busy,
  onClose,
  onSubmit,
  leading,
}: {
  title: string;
  description: string;
  submitLabel: string;
  busyLabel: string;
  initial: GroupFormValues;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
  leading?: ReactNode;
}) {
  const id = useId();
  const { handleSubmit, isValid, getField, values, handleValue } = useForm({
    initial,
    schema,
    onSubmit,
  });
  const nameField = getField("name");
  const descriptionField = getField("description");
  // Keep a group's existing color selectable even if the picker no longer lists it.
  const selectedColor = values.color ?? 0;
  const colors = (GROUP_COLOR_PICKER as readonly number[]).includes(selectedColor)
    ? GROUP_COLOR_PICKER
    : [...GROUP_COLOR_PICKER, selectedColor];

  return (
    <FormDialog
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormDialogField
          label="Group name"
          htmlFor={`${id}-name`}
          error={nameField.error}
        >
          <FormDialogInput
            id={`${id}-name`}
            disabled={busy}
            name={nameField.name}
            value={nameField.value}
            onChange={nameField.onChange}
            placeholder="e.g. Family"
            aria-invalid={!!nameField.error}
          />
        </FormDialogField>
        <FormDialogField
          label="Description (Optional)"
          htmlFor={`${id}-description`}
          error={descriptionField.error}
        >
          <FormDialogTextarea
            id={`${id}-description`}
            disabled={busy}
            name={descriptionField.name}
            value={descriptionField.value}
            onChange={descriptionField.onChange}
            placeholder="Short description"
            aria-invalid={!!descriptionField.error}
          />
        </FormDialogField>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm text-text-neutral-strong">
            Group color
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((color, index) => (
              <button
                key={color}
                type="button"
                disabled={busy}
                aria-label={`Color ${index + 1}`}
                aria-pressed={selectedColor === color}
                onClick={() => handleValue("color", color)}
                style={{ backgroundColor: groupColorVar(color) }}
                className={cn(
                  "flex size-6 cursor-pointer items-center justify-center rounded-md text-[var(--group-on-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-neutral-strong disabled:cursor-not-allowed",
                )}
              >
                {selectedColor === color ? (
                  <Check className="size-4" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </fieldset>
        <FormDialogFooter
          submitLabel={submitLabel}
          busyLabel={busyLabel}
          busy={busy}
          disabled={!isValid}
          onDismiss={onClose}
          leading={leading}
        />
      </form>
    </FormDialog>
  );
}
