"use client";

import { useId, type ChangeEvent } from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ITexinput } from "./text-input";

type CheckboxProps = Omit<
  ITexinput,
  "error" | "end" | "labelClassName" | "inputClassName" | "type"
>;

function syntheticCheckboxChange(
  name: string | undefined,
  checked: boolean,
): ChangeEvent<HTMLInputElement> {
  const target = {
    checked,
    name: name ?? "",
    type: "checkbox",
  } as HTMLInputElement;
  return {
    target,
    currentTarget: target,
  } as ChangeEvent<HTMLInputElement>;
}

export function Checkbox({
  label,
  className = "",
  id: idProp,
  onChange,
  checked,
  name,
  disabled,
  required,
}: CheckboxProps) {
  const uid = useId();
  const controlId = idProp ?? uid;

  return (
    <div className={cn("flex shrink-0 items-center gap-2 font-inter", className)}>
      <ShadcnCheckbox
        id={controlId}
        checked={checked}
        disabled={disabled}
        name={name}
        required={required}
        onCheckedChange={(value) => {
          onChange?.(syntheticCheckboxChange(name, value === true));
        }}
      />
      {label ? (
        <Label htmlFor={controlId} className="cursor-pointer font-normal text-inherit">
          {label}
        </Label>
      ) : null}
    </div>
  );
}
