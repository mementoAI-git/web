import { Button } from "@/components/ui/button";
import bookIcon from "@/assets/chat-empty/book.svg";
import personIcon from "@/assets/chat-empty/person.svg";
import "./chat-empty-state.css";

export interface ChatStarter {
  label: string;
  prompt: string;
  icon?: string;
}

/** Shared Figma starter cards for personal and connection Mementos. */
export function ChatStarterCards({
  prompts,
  onPrompt,
  disabled = false,
}: {
  prompts: ChatStarter[];
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
      {prompts.map(({ label, prompt, icon }, index) => (
        <Button
          key={label}
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onPrompt(prompt)}
          className="relative h-auto items-center justify-start sm:min-h-[136px] sm:items-start overflow-hidden rounded-xl border-stroke-neutral-weak bg-fill-neutral-weak px-4 py-3 text-left font-geist text-sm leading-5 font-normal whitespace-normal text-text-neutral-strong hover:border-stroke-neutral-strong hover:bg-fill-neutral-weak hover:text-text-neutral-strong transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:active:translate-y-0"
        >
          <span aria-hidden className="chat-empty-grid">
            <span />
            <span />
          </span>
          <span className="relative flex w-full flex-row items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center"
            >
              <img
                src={icon || (index === 0 ? bookIcon : personIcon)}
                alt=""
                width={index === 0 ? 40 : 26.6667}
                height={index === 0 ? 40 : 33.3333}
              />
            </span>
            <span className="text-balance">{label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}
