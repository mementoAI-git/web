import { useEffect, useState } from "react";
import dayjs from "dayjs";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { DashboardPromptSlot } from "@/utility/interface";
import { MicIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import type { DailyPromptCapturePayload } from "@/lib/quick-capture-drafts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/utility";

function DailyPromptSkeleton() {
  return (
    <div className="h-full rounded-2xl bg-fill-neutral-weaker p-5 shadow-sm">
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="space-y-3 mb-8">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mx-auto h-6 w-3/4" />
      </div>
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}

function tabLabel(row: DashboardPromptSlot, index: number): string {
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
  const [activeTab, setActiveTab] = useState("0");
  const { open } = useModal();
  const dateKey = dayjs().format("YYYY-MM-DD");
  const promptsUrl = `${endpoint.prompts}?date_key=${encodeURIComponent(dateKey)}`;
  const { data, isLoading } = useSWR(promptsUrl);

  const rows = (data?.data ?? []) as DashboardPromptSlot[];
  const activeIndex = Number(activeTab) || 0;
  useEffect(() => {
    if (rows.length === 0) return;
    if (activeIndex < rows.length) return;
    setActiveTab("0");
  }, [activeIndex, rows.length]);

  const openCapture = (row: DashboardPromptSlot) => {
    if (row.answered) return;
    try {
      const daily_prompt = toCapturePayload(row);
      open("quick-capture", { daily_prompt });
    } catch {
      /* ignore */
    }
  };

  if (isLoading) {
    return <DailyPromptSkeleton />;
  }

  if (rows.length === 0) {
    return null;
  }

  const activeRow = rows[activeIndex];
  const hasMultiple = rows.length > 1;
  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl bg-fill-neutral-weaker p-4 shadow-sm sm:gap-6 sm:p-5">
      {hasMultiple && (
        <div
          role="radiogroup"
          aria-label="Daily prompts"
          className="flex w-full flex-wrap gap-2"
        >
          {rows.map((row, i) => {
            const value = `${i}`;
            const inputId = `daily-prompt-${row.slot_kind}-${row.reflection_day_key}-${i}`;
            return (
              <div key={inputId} className="relative">
                <input
                  type="radio"
                  id={inputId}
                  name="daily-prompt-slot"
                  value={value}
                  checked={activeTab === value}
                  onChange={() => setActiveTab(value)}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={inputId}
                  className={cn(
                    "inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-full border border-stroke-neutral-weaker bg-fill-neutral-weaker px-3 py-1.5 font-inter text-[12px] font-medium text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak sm:min-h-0 sm:px-2 sm:py-1",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-v3-fill-weaker",
                    "peer-checked:border-black peer-checked:bg-black peer-checked:text-white",
                    "peer-checked:hover:!border-black peer-checked:hover:!bg-black",
                  )}
                >
                  {tabLabel(row, i)}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <TypographyH2 className="flex flex-1 flex-col text-left font-inter text-base font-normal leading-relaxed text-text-neutral-strong sm:text-base md:text-base lg:text-base">
          {promptBodyText(activeRow)}
        </TypographyH2>
      </div>

      {activeRow.answered ? (
        <TypographyMuted className="font-inter text-sm text-text-neutral-weak">
          You&apos;ve already shared a reflection for this one today.
        </TypographyMuted>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
          <Button
            onClick={() => openCapture(activeRow)}
            className="min-h-[44px] w-full gap-2 rounded-full px-5 font-inter text-sm font-semibold sm:h-10 sm:w-auto"
          >
            <MicIcon className="size-4 shrink-0" />
            Write or speak it
          </Button>
        </div>
      )}
    </div>
  );
}
