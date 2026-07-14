"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Mic, Paperclip, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AnimatedAiInputOption<TValue extends string> {
  description?: string;
  label: string;
  value: TValue;
}

interface AnimatedAiInputProps<TValue extends string> {
  disabled?: boolean;
  dropdownAriaLabel?: string;
  dropdownLabel?: string;
  id?: string;
  onSubmit: (value: string) => void;
  onValueChange: (value: string) => void;
  onVariantChange: (value: TValue) => void;
  placeholder: string;
  submitAriaLabel?: string;
  value: string;
  variant: TValue;
  variantOptions: Array<AnimatedAiInputOption<TValue>>;
}

function useAutoResizeTextarea(minHeight: number, maxHeight = 300) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(
    (reset = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      textarea.style.height = `${Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight),
      )}px`;
    },
    [maxHeight, minHeight],
  );

  return { adjustHeight, textareaRef };
}

export function AnimatedAiInput<TValue extends string>({
  disabled = false,
  dropdownAriaLabel = "Assistant tone",
  dropdownLabel = "Assistant tone",
  id = "animated-ai-input",
  onSubmit,
  onValueChange,
  onVariantChange,
  placeholder,
  submitAriaLabel = "Send",
  value,
  variant,
  variantOptions,
}: AnimatedAiInputProps<TValue>) {
  const { adjustHeight, textareaRef } = useAutoResizeTextarea(72, 220);
  const activeVariant =
    variantOptions.find((option) => option.value === variant) ?? variantOptions[0];

  useEffect(() => {
    adjustHeight(value.length === 0);
  }, [adjustHeight, value]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  const handleSubmit = useCallback(() => {
    if (disabled || value.trim().length === 0) return;

    onSubmit(value);
    adjustHeight(true);
  }, [adjustHeight, disabled, onSubmit, value]);

  return (
    <div className="rounded-[20px] border border-stroke-neutral-weak bg-bg-neutral p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>

      <div className="rounded-[16px] bg-fill-neutral-weaker/70">
        <div className="max-h-60 overflow-y-auto">
          <Textarea
            id={id}
            ref={textareaRef}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => {
              onValueChange(event.target.value);
              adjustHeight();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            className={cn(
              "min-h-[72px] border-0 bg-transparent px-4 py-3 text-sm leading-6 text-text-neutral-strong shadow-none ring-0",
              "placeholder:text-text-neutral-weaker focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Add context"
              className="flex size-8 items-center justify-center rounded-xl text-icon-neutral-weak transition-colors hover:bg-fill-neutral-weak hover:text-text-neutral-strong"
            >
              <Paperclip className="size-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-2.5 text-xs text-text-neutral-weak hover:bg-fill-neutral-weak hover:text-text-neutral-strong"
                  aria-label={dropdownAriaLabel}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={activeVariant.value}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-text-brand-strong" />
                      <span>{activeVariant.label}</span>
                      <ChevronDown className="size-3.5" />
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 rounded-2xl border border-stroke-neutral-weak bg-bg-neutral p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
              >
                <DropdownMenuLabel className="px-2.5 pb-1 pt-1 font-inter text-[10px] font-semibold uppercase tracking-[0.12em] text-text-neutral-weaker">
                  {dropdownLabel}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-1.5 my-1 bg-stroke-neutral-weaker" />
                {variantOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onVariantChange(option.value)}
                    className={cn(
                      "flex items-start justify-between rounded-xl px-2.5 py-2 focus:bg-fill-neutral-weaker focus:text-text-neutral-strong",
                      variant === option.value && "bg-fill-neutral-weaker",
                    )}
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-text-neutral-strong">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="text-xs leading-5 text-text-neutral-weak">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {variant === option.value ? (
                      <Check className="mt-0.5 size-4 text-text-brand-strong" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Voice input"
              className="flex size-8 items-center justify-center rounded-xl text-icon-neutral-weak transition-colors hover:bg-fill-neutral-weak hover:text-text-neutral-strong"
            >
              <Mic className="size-4" />
            </button>

            <Button
              type="button"
              size="icon-sm"
              disabled={disabled || value.trim().length === 0}
              onClick={handleSubmit}
              className="rounded-xl bg-fill-brand-strong text-white hover:bg-fill-brand-strong/90"
              aria-label={submitAriaLabel}
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
