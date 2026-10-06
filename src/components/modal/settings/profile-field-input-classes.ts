import { cn } from "@/utility";

export const profileFieldTextInputClassName = cn(
  "!text-v3-text-strong placeholder:!text-v3-text-weaker",
);

export const profileFieldLabelClassName = cn("!text-v3-text-weak !font-normal");

export const profileFieldInputShellClassName = cn(
  "!border-v3-stroke-weak !bg-bg-neutral shadow-sm focus-within:!border-[1.5px] focus-within:!border-v3-stroke-strong",
  "group-[.error]:!border-[1.5px] group-[.error]:!border-danger",
);
