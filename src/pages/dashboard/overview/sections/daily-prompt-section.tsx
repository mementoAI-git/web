import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useTextReveal } from "@/components/motion/use-text-reveal";
import "@/components/motion/text-reveal.css";
import "../overview-motion.css";
import {
  avatarsForCard,
  createAvatarOrder,
  refreshAvatarOrder,
} from "./reflection-avatars";
import { getPromptReplyCounts } from "./prompt-reply-count";
import { getPromptAccent } from "./prompt-accent";
import dayjs from "dayjs";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { DashboardPromptSlot } from "@/utility/interface";
import { Shuffle } from "lucide-react";
import useFetcher from "@/hooks/use-fetcher";
import { useEffect, useRef, useState } from "react";
import { getCategory } from "@/utility";
import { useNavigate } from "react-router-dom";
import type { DailyPromptCapturePayload } from "@/lib/quick-capture-drafts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

function DailyPromptSkeleton() {
  return (
    <div className="sky-card flex h-[230px] overflow-hidden w-[min(78vw,320px)] shrink-0 flex-col max-lg:snap-start lg:w-auto lg:min-w-0 lg:shrink justify-between gap-6 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weaker p-[23px]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <Skeleton className="h-6 w-full rounded-full" />
    </div>
  );
}

function PromptText({ text }: { text: string }) {
  const accent = getPromptAccent(text);
  if (!accent) return <>{text}</>;
  return (
    <>
      {text.slice(0, accent.start)}
      <i className="font-medium text-text-brand-strong">
        {text.slice(accent.start, accent.end)}
      </i>
      {text.slice(accent.end)}
    </>
  );
}

function promptLabel(row: DashboardPromptSlot, index: number): string {
  if (row.display_label) return row.display_label;
  return `Prompt ${index + 1}`;
}

function promptBodyText(row: DashboardPromptSlot): string {
  if (row.slot_kind === "ai") return row.ai_prompt_text;
  return row.prompt.title;
}

function toCapturePayload(row: DashboardPromptSlot): DailyPromptCapturePayload {
  if (row.slot_kind === "ai") {
    return {
      pinned_text: row.ai_prompt_text,
      prompt_type: "ai-generated",
      reflection_day_key: row.reflection_day_key,
    };
  }
  const id = row.prompt._id;
  if (!id) {
    throw new Error("Missing prompt id");
  }
  return {
    pinned_text: row.prompt.title,
    prompt_type: "static",
    prompt_id: id,
    reflection_day_key: row.reflection_day_key,
  };
}

export default function DailyPromptSection() {
  const navigate = useNavigate();
  const shuffleUrl = `${endpoint.prompts}/shuffle`;
  const { data: shuffleData, error: shuffleError, mutate: refreshShuffle } = useSWR(shuffleUrl);
  const retryShuffle = useRequestRecovery("reflection-shuffle", shuffleError, refreshShuffle, "Shuffle availability couldn’t be loaded. Try again.");
  const { trigger: requestShuffle, isMutating: shuffling } = useFetcher(shuffleUrl);
  const usage = shuffleData?.data as { used: number; remaining: number; resets_at: string } | undefined;
  const offset = usage?.used ?? 0;
  useEffect(() => {
    if (!usage?.resets_at) return;
    const timeout = window.setTimeout(() => { void refreshShuffle().catch(() => undefined); }, Math.max(1000, Date.parse(usage.resets_at) - Date.now() + 100));
    return () => window.clearTimeout(timeout);
  }, [usage?.resets_at, refreshShuffle]);
  const [avatarOrder, setAvatarOrder] = useState(createAvatarOrder);
  const dateKey = dayjs().format("YYYY-MM-DD");
  const promptsUrl = `${endpoint.prompts}?date_key=${encodeURIComponent(dateKey)}`;
  const { data, isLoading, error, mutate } = useSWR(promptsUrl);

  const retry = useRequestRecovery("daily-reflections", error, mutate, "Reflections couldn’t be loaded. Try again.");
  const rows = (data?.data ?? []) as DashboardPromptSlot[];
  const replyCounts = getPromptReplyCounts(rows);
  const openCapture = (row: DashboardPromptSlot) => {
    const payload = toCapturePayload(row);
    navigate("/chat/reflection/new", {state: {reflectionEntry: {
      question: payload.pinned_text,
      category: row.slot_kind === "static" ? row.prompt.category : undefined,
      request: {
        prompt_type: payload.prompt_type,
        prompt_id: payload.prompt_id,
        prompt_text: payload.prompt_type === "ai-generated" ? payload.pinned_text : undefined,
        reflection_day_key: payload.reflection_day_key,
      },
    }}});
  };

  const visibleRows = rows.map(
    (_, index) => rows[(index + offset) % rows.length],
  );

  const cardsRef = useRef<HTMLDivElement>(null);
  useTextReveal(cardsRef, isLoading ? "loading" : visibleRows.map(promptBodyText).join("|"));

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-6"
      aria-labelledby="reflection-heading"
    >
      <div className="flex items-center justify-between gap-4">
        <TypographyH2
          id="reflection-heading"
          className="font-garamond text-[28px] font-normal leading-tight text-text-neutral-strong sm:text-[32px] lg:text-[32px]"
        >
          Continue <i className="text-text-neutral-weaker">reflecting</i>
        </TypographyH2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Shuffle reflections"
          aria-describedby="reflection-shuffle-status"
          title={usage?.remaining === 0 ? "Daily limit reached. Resets at midnight UTC." : `${usage?.remaining ?? 0} shuffles left today`}
          disabled={rows.length < 2 || !usage || usage.remaining === 0 || shuffling}
          onClick={async () => {
            try {
              const response = await requestShuffle({});
              await refreshShuffle(response, { revalidate: false });
              if ((response.data as { allowed?: boolean })?.allowed) setAvatarOrder(refreshAvatarOrder);
            } catch {
              // The request helper reports the error; preserve the current cards.
              void refreshShuffle().catch(() => undefined);
            }
          }}
          className="rounded-lg text-icon-neutral-strong"
        >
          <Shuffle className="size-6" aria-hidden />
        </Button>
      </div>
      <p id="reflection-shuffle-status" role="status" className="-mt-4 text-xs text-text-neutral-weak">
        {usage ? (usage.remaining === 0 ? "Daily shuffle limit reached. Resets at midnight UTC." : `${usage.remaining} ${usage.remaining === 1 ? "shuffle" : "shuffles"} left today`) : shuffleError ? <Button variant="ghost" size="sm" onClick={retryShuffle}>Retry shuffle availability</Button> : "Checking shuffle allowance…"}
      </p>
      <div ref={cardsRef} className="overview-reflections-reveal t-stagger scrollbar-hide flex min-w-0 gap-4 max-lg:-mx-4 max-lg:-my-1 max-lg:snap-x max-lg:snap-mandatory max-lg:scroll-px-4 max-lg:overflow-x-auto max-lg:overscroll-x-contain max-lg:px-4 max-lg:py-1 sm:max-lg:-mx-5 sm:max-lg:scroll-px-5 sm:max-lg:px-5 md:max-lg:-mx-6 md:max-lg:scroll-px-6 md:max-lg:px-6 lg:grid lg:grid-cols-3 lg:gap-6">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <DailyPromptSkeleton key={index} />
            ))
          : visibleRows.map((row, position) => {
              const index = rows.indexOf(row);
              const category =
                row.slot_kind === "static"
                  ? getCategory(row.prompt.category ?? "")
                  : null;
              const label =
                (category?.slug
                  ? category.slug
                      .replace(/-/g, " ")
                      .replace(/^./, (letter) => letter.toUpperCase())
                  : row.display_label) || "Who I am";
              return (
                <article
                  key={`${row.slot_kind}-${row.reflection_day_key}-${index}`}
                  aria-label={promptLabel(row, index)}
                  style={{ transitionDelay: `calc(var(--stagger-stagger) * ${position})` }}
                  className="t-stagger-line relative sky-card flex h-[230px] overflow-hidden w-[min(78vw,320px)] shrink-0 flex-col max-lg:snap-start lg:w-auto lg:min-w-0 lg:shrink justify-between gap-6 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weaker p-[23px] transition-colors hover:bg-fill-neutral-weak"
                >
                  {/* Fixed card height: long prompts clamp to 4 lines; the full text is on the reflection page. */}
                  <p className="line-clamp-4 min-h-0 font-garamond text-[20px] font-normal leading-[27px] text-text-neutral-strong">
                    <button
                      type="button"
                      aria-label={`Reflect on ${promptLabel(row, index)}`}
                      onClick={() => void openCapture(row)}
                      className="cursor-pointer text-left outline-none before:absolute before:inset-0 before:rounded-3xl focus-visible:before:ring-2 focus-visible:before:ring-stroke-brand-strong"
                    >
                      <PromptText text={promptBodyText(row)} />
                    </button>
                  </p>
                  {row.answered ? (
                    <TypographyMuted className="font-inter text-sm text-text-neutral-weak">
                      You&apos;ve already shared a reflection for this one
                      today.
                    </TypographyMuted>
                  ) : (
                    <div className="flex items-center justify-between gap-1 font-inter text-sm">
                      <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-fill-neutral-weak px-[7px] py-0.5 text-text-neutral-strong">
                        <span
                          aria-hidden
                          className={`size-[9px] shrink-0 rounded-full ${category?.slug === "people-i-love" ? "bg-fill-overview-voice" : "bg-fill-warning-strong"}`}
                        />
                        <span className="truncate">{label}</span>
                      </span>
                      {row.slot_kind === "ai" ? (
                        <span className="shrink-0 text-text-neutral-weak">For you</span>
                      ) : (
                      <span className="flex shrink-0 items-center gap-2">
                        <span aria-hidden className="flex -space-x-2.5">
                          {avatarsForCard(avatarOrder, index).map((src) => (
                            <img
                              key={src}
                              src={src}
                              alt=""
                              width={24}
                              height={24}
                              loading="lazy"
                              decoding="async"
                              className="size-6 rounded-full border border-stroke-neutral-weak object-cover"
                            />
                          ))}
                        </span>
                        <span className="text-text-neutral-weaker">
                          {replyCounts[index].toLocaleString("en-US")} people
                        </span>
                      </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
      </div>
      {error && <Button variant="outline" onClick={retry}>Retry loading reflections</Button>}
      {!error && !isLoading && rows.length === 0 && (
        <TypographyMuted>
          No reflections available today. Explore more topics below.
        </TypographyMuted>
      )}
    </section>
  );
}
