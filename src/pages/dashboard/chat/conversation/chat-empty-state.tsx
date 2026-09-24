import mementoLogo from "@/assets/image/m-logo.png";
import { BookOpen, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const prompts = [
  { label: "Share a story from my childhood", icon: BookOpen },
  { label: "What are some of my core values?", icon: UserRound },
] as const;

export function ChatEmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <img src={mementoLogo} alt="" className="mb-3 size-11 rounded-xl object-cover" />
      <h2 className="font-geist text-base font-semibold text-text-neutral-strong">
        Chat with Memento AI
      </h2>
      <p className="mt-2 max-w-md font-geist text-sm leading-5 text-text-neutral-weak">
        This is your space to hold conversations and refine how your AI responds. Ask questions,
        discuss stories you&apos;ve posted, and explore what matters to you. The more you chat, the
        better your AI becomes.
      </p>
      <div className="mt-5 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            onClick={() => onPrompt(label)}
            className="h-24 justify-start rounded-xl border-stroke-neutral-weaker bg-background px-4 py-3 text-left font-geist text-sm font-normal whitespace-normal text-text-neutral-strong transition-[transform,background-color,border-color] duration-150 active:scale-[0.98]"
          >
            <span className="flex h-full flex-col items-start justify-between gap-2">
              <Icon data-icon="inline-start" className="text-icon-brand-strong" aria-hidden />
              <span>{label}</span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
