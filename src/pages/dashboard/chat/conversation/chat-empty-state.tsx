import { getProfileAvatarUrl } from "@/utility/profile-avatar";
import { ChatStarterCards } from "./chat-starter-cards";
import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/hooks/use-store";
import bookIcon from "@/assets/chat-empty/book.svg";
import personIcon from "@/assets/chat-empty/person.svg";
import "./chat-empty-state.css";

export function ChatEmptyState({
  onPrompt,
}: {
  onPrompt: (prompt: string) => void;
}) {
  const { user } = useStore();
  const completedOnboarding = user?.onboarding_status === "completed";
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.nickname;
  const prompts = [
    {
      label: "Help me share my first memory",
      prompt:
        "Help me share my first memory. Ask me one simple question at a time to help me get started.",
      icon: bookIcon,
    },
    completedOnboarding
      ? {
          label: "What do you know about me so far?",
          prompt:
            "Summarize what I shared during onboarding. Use only information I actually provided, and ask me about anything you don't know yet.",
          icon: personIcon,
        }
      : {
          label: "Ask me a question to get to know me",
          prompt:
            "Ask me one simple question to get to know me. Let's start with what matters to me right now.",
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
        <p className="max-w-[255px] font-geist text-sm leading-5 text-text-neutral-weak">
          Share a memory, or let your Memento ask you a question.
        </p>
      </div>
      <ChatStarterCards prompts={prompts} onPrompt={onPrompt} />
    </section>
  );
}
