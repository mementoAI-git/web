"use client";

import type { ChangeEvent } from "react";
import { AutogenerateTitleButton } from "@/components/Buttons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TitleFieldProps {
  id: string;
  value: string;
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  draftTitle: string;
  bodyPlain: string;
  onSuggestTitle: (title: string) => void;
}

export function TitleField({
  id,
  value,
  name,
  onChange,
  draftTitle,
  bodyPlain,
  onSuggestTitle,
}: TitleFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-text-neutral-weak">
        Title
      </Label>
      <InputGroup
        className={cn(
          "h-auto min-h-12 rounded-xl border-stroke-neutral-weak bg-v3-bg",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-inset",
        )}
      >
        <InputGroupInput
          id={id}
          placeholder="Enter title here"
          value={value}
          name={name}
          onChange={onChange}
          className={cn(
            "min-h-12 py-3 px-4 font-inter text-base md:text-base text-text-neutral-strong",
            "placeholder:text-neutral-weak",
          )}
        />
        <InputGroupAddon align="inline-end" className="pr-2">
          <AutogenerateTitleButton
            draftTitle={draftTitle}
            bodyPlain={bodyPlain}
            onTitle={onSuggestTitle}
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
