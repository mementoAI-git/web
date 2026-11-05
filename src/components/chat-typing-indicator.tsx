import { ThinkingOrb } from "thinking-orbs";
import { useTheme } from "@/contexts/theme";

/** Matches mobile's breathing orb and quiet waiting label. */
export function ChatTypingIndicator() {
  const { resolvedTheme } = useTheme();

  return (
    <div
      role="status"
      aria-label="Memento is thinking"
      className="mb-5 flex items-center gap-3 self-start px-4 py-2"
    >
      <ThinkingOrb
        state="breathing"
        size={20}
        theme={resolvedTheme}
        style={{ width: 16, height: 16, flexShrink: 0 }}
        aria-hidden="true"
      />
      <span className="font-sans text-sm text-text-neutral-weak">
        Thinking…
      </span>
    </div>
  );
}
