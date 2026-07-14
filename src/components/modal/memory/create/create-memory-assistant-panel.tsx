"use client";

import { Button } from "@/components/ui/button";
import { AnimatedAiInput } from "@/components/ui/animated-ai-input";
import { cn } from "@/lib/utils";
import type {
  CreateMemoryAssistantAction,
  CreateMemoryAssistantMessage,
  CreateMemoryAssistantSuggestion,
  CreateMemoryAssistantTone,
} from "./create-memory-ai";

interface CreateMemoryAssistantPanelProps {
  input: string;
  isWorking: boolean;
  messages: CreateMemoryAssistantMessage[];
  onApplyAction: (action: CreateMemoryAssistantAction) => void;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => void;
  suggestions: CreateMemoryAssistantSuggestion[];
  tone: CreateMemoryAssistantTone;
  onToneChange: (tone: CreateMemoryAssistantTone) => void;
}

const toneOptions: Array<{
  value: CreateMemoryAssistantTone;
  label: string;
  description: string;
}> = [
  { value: "whimsical", label: "Whimsical", description: "Warm, imaginative, and light" },
  { value: "reflective", label: "Reflective", description: "Calm, thoughtful, and gentle" },
  { value: "direct", label: "Direct", description: "Plainspoken and concise" },
  { value: "legacy", label: "Legacy", description: "Oriented toward wisdom and inheritance" },
];

export function CreateMemoryAssistantPanel({
  input,
  isWorking,
  messages,
  onApplyAction,
  onInputChange,
  onSubmit,
  suggestions,
  tone,
  onToneChange,
}: CreateMemoryAssistantPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
          <div className="space-y-1">
            <p className="font-inter text-sm font-semibold text-text-neutral-strong">Memento AI</p>
            <p className="font-inter text-sm leading-6 text-text-neutral-weak">
              Hi, I&apos;m Memento AI. I have full context on your stories and memories, and can
              help you shape this story. Try asking for title ideas, stronger tags, or what details
              might be missing.
            </p>
          </div>

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSubmit(suggestion.prompt)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-left font-inter text-xs font-medium transition-colors",
                    suggestion.featured
                      ? "border-v3-brand-strong/30 bg-v3-brand-strong/[0.08] text-text-brand-strong hover:bg-v3-brand-strong/[0.14]"
                      : "border-stroke-neutral-weak bg-fill-neutral-weaker text-text-neutral-strong hover:bg-fill-neutral-weak",
                  )}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}

          {messages.length === 0 ? null : (
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-2">
                  {message.role === "assistant" ? (
                    <p className="font-inter text-sm font-semibold text-text-neutral-strong">
                      Memento AI
                    </p>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-full rounded-2xl font-inter text-sm leading-6",
                      message.role === "assistant"
                        ? "text-text-neutral-strong"
                        : "ml-4 self-end rounded-2xl bg-fill-neutral-weaker px-4 py-3 text-text-neutral-strong",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  </div>

                  {message.action ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        onClick={() => onApplyAction(message.action!)}
                        variant="outline"
                        className="h-8 w-full justify-start rounded-[10px] border-stroke-neutral-weak bg-bg-neutral px-3 font-inter text-xs font-medium text-text-neutral-strong shadow-none hover:bg-fill-neutral-weaker"
                      >
                        {message.action.type === "apply_body"
                          ? "Update journal draft"
                          : message.action.type === "apply_title"
                            ? "Apply title"
                            : message.action.type === "apply_enrichment"
                              ? "Apply enrichment"
                              : "Apply tags"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        <AnimatedAiInput
          id="create-memory-assistant-input"
          value={input}
          onValueChange={onInputChange}
          onSubmit={onSubmit}
          placeholder="Ask anything here. use @ for context."
          disabled={isWorking}
          variant={tone}
          variantOptions={toneOptions}
          onVariantChange={onToneChange}
          dropdownAriaLabel="Agent personality"
          dropdownLabel="Agent personality"
          submitAriaLabel="Send"
        />
      </div>
    </div>
  );
}
