import { getProfileAvatarUrl } from "@/utility/profile-avatar";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/hooks/use-store";
import bookIcon from "@/assets/chat-empty/book.svg";
import personIcon from "@/assets/chat-empty/person.svg";
import "./chat-empty-state.css";

export function ChatEmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const { user } = useStore();
  const completedOnboarding = user?.onboarding_status === "completed";
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.nickname;
  const prompts = [
    {
      label: "Help me share my first memory",
      prompt: "Help me share my first memory. Ask me one simple question at a time to help me get started.",
      icon: bookIcon,
    },
    completedOnboarding
      ? {
          label: "What do you know about me so far?",
          prompt: "Summarize what I shared during onboarding. Use only information I actually provided, and ask me about anything you don't know yet.",
          icon: personIcon,
        }
      : {
          label: "Ask me a question to get to know me",
          prompt: "Ask me one simple question to get to know me. Let's start with what matters to me right now.",
          icon: personIcon,
        },
  ];

  return (
    <section className="mx-auto flex w-full max-w-[490px] flex-1 flex-col items-center justify-center gap-5 px-4 py-8 text-center">
      <div className="flex w-full flex-col items-center gap-3">
        <UserAvatar
          alt="Your avatar"
          src={getProfileAvatarUrl(user)}
          name={name}
          email={user?.email}
          userId={user?._id}
          size="lg"
          className="size-16! rounded-full!"
        />
        <h2 className="font-geist text-base leading-6 font-semibold text-text-neutral-strong">
          Chat with your Memento
        </h2>
        <p className="max-w-[442px] font-geist text-sm leading-5 text-text-neutral-weak">
          This is your space to share memories and help your Memento get to know you.
          Start with a moment that matters, or let your Memento ask a question.
          The more you share, the better your Memento understands you.
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
        {prompts.map(({ label, prompt, icon }, index) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            onClick={() => onPrompt(prompt)}
            className="relative h-auto min-h-[136px] items-start justify-start overflow-hidden rounded-xl border-stroke-neutral-weak bg-fill-neutral-weak px-4 py-5 text-left font-geist text-sm leading-5 font-normal whitespace-normal text-text-neutral-strong hover:border-stroke-neutral-strong hover:bg-fill-neutral-weak hover:text-text-neutral-strong transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:active:translate-y-0"
          >
            <span aria-hidden className="chat-empty-grid"><span /><span /></span>
            <span className="relative flex w-full flex-col items-start gap-4">
              <span aria-hidden className="flex size-10 items-center justify-center">
                <img src={icon} alt="" width={index === 0 ? 40 : 26.6667} height={index === 0 ? 40 : 33.3333} />
              </span>
              <span>{label}</span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
