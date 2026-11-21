import { AudioLines } from "lucide-react";
import useSWR from "swr";
import {
  formatVoiceMinutes,
  parseVoiceUsage,
  voiceMinutes,
  voiceUsageKey,
} from "@/features/voice/usage";

function resetLabel(date: Date | null): string | null {
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
}

/**
 * Voice mode minutes, top of the Milestones tab: this month (starts over at
 * midnight on the 1st, local time) and all time. On the free plan the monthly
 * card also shows the 90-minute allowance, a bar and what is left. Matches
 * mobile `VoiceMinutesCards.tsx`.
 */
export function VoiceMinutesCards() {
  const { data, isLoading } = useSWR<{ data: unknown }>(voiceUsageKey());
  const usage = parseVoiceUsage(data?.data);
  if (!usage && !isLoading) return null;

  const month = usage ? formatVoiceMinutes(usage.monthSeconds) : "—";
  const allTime = usage ? formatVoiceMinutes(usage.allTimeSeconds) : "—";
  const resets = resetLabel(usage?.monthResetsAt ?? null);
  const free = usage?.freeLimitSeconds ? usage : null;
  const limitMinutes = free ? voiceMinutes(free.freeLimitSeconds as number) : 0;
  const leftMinutes = free ? voiceMinutes(free.freeLeftSeconds ?? 0) : 0;
  const usedUp = Boolean(free) && leftMinutes === 0;
  const progress = free ? Math.min(1, free.monthSeconds / (free.freeLimitSeconds as number)) : 0;

  return (
    <div className="grid grid-cols-2 gap-3" aria-label="Voice mode minutes">
      <section className="insights-card flex-col gap-1.5 px-4 py-5" aria-label={`Voice mode this month: ${month}`}>
        <p className="flex items-center gap-1.5 font-inter text-sm text-text-neutral-weak">
          <AudioLines className="size-4 text-v3-brand-strong" aria-hidden />
          This month
        </p>
        <p className="font-inter text-xl font-semibold tabular-nums text-text-neutral-strong">{month}</p>
        {free && (
          <>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-stroke-neutral-weak"
              role="progressbar"
              aria-label="Free voice minutes used"
              aria-valuemin={0}
              aria-valuemax={limitMinutes}
              aria-valuenow={limitMinutes - leftMinutes}
            >
              <div
                className={usedUp ? "h-full rounded-full bg-text-warning-strong" : "h-full rounded-full bg-v3-brand-strong"}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="font-inter text-sm text-text-neutral-weaker">
              {usedUp ? `All of ${limitMinutes} free min used` : `${leftMinutes} of ${limitMinutes} free min left`}
            </p>
          </>
        )}
        {resets && <p className="font-inter text-sm text-text-neutral-weaker">Starts over {resets}</p>}
      </section>
      <section className="insights-card flex-col gap-1.5 px-4 py-5" aria-label={`Voice mode all time: ${allTime}`}>
        <p className="flex items-center gap-1.5 font-inter text-sm text-text-neutral-weak">
          <AudioLines className="size-4 text-v3-brand-strong" aria-hidden />
          All time
        </p>
        <p className="font-inter text-xl font-semibold tabular-nums text-text-neutral-strong">{allTime}</p>
        <p className="font-inter text-sm text-text-neutral-weaker">of voice mode</p>
      </section>
    </div>
  );
}
