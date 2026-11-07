import { ThinkingOrb } from "thinking-orbs";
import { useTheme } from "@/contexts/theme";

/** Matches mobile's breathing orb and quiet waiting label; `status` says what Memento is doing. */
export function ChatTypingIndicator({ status }: { status?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      role="status"
      aria-label={status || "Memento is thinking"}
      aria-live="polite"
      className="mb-5 flex items-center gap-3 self-start px-4 py-2"
    >
      <ThinkingOrb
        state="breathing"
        size={20}
        theme={resolvedTheme}
        // The ring fills ~78% of its canvas: a 20px canvas shows a 16px orb.
        // The negative margin keeps its footprint at 16px beside the label.
        style={{ width: 20, height: 20, margin: -2, flexShrink: 0 }}
        aria-hidden="true"
      />
      <span className="font-sans text-[16px] leading-6 text-text-neutral-weak">
        {status || "Thinking…"}
      </span>
    </div>
  );
}
