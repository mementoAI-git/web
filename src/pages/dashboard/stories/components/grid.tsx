import DOMPurify from "isomorphic-dompurify";
import { DoubleHeartIcon } from "@/components/icons";
import { ensureLinksOpenInNewTab } from "@/utility";
import { MemoryItemActions } from "./dropdown";
import type { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import { QuickCaptureProcessingBadge } from "@/components/memory/quick-capture-processing-badge";

import { PlaySolidIcon, WaveIcon } from "@/components/icons";
import recordBanner from "@/assets/icon/record-banner.png";

/** Rotate aspect ratios so the masonry column layout feels like Pinterest. */
const MEDIA_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[5/6]",
  "aspect-[2/3]",
] as const;

const TEXT_MIN_HEIGHTS = ["min-h-[200px]", "min-h-[260px]", "min-h-[228px]", "min-h-[244px]"] as const;

function getTopicColor(topic: string) {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsla(${hue}, 85%, 97%, 0.8)`,
    border: `hsla(${hue}, 60%, 88%, 0.9)`,
    text: `hsl(${hue}, 65%, 28%)`,
  };
}

function getStoryCardTitle(memory: IMemory): string {
  if (memory.prompt_type && memory.prompt_text?.trim()) {
    return memory.prompt_text.trim();
  }
  return memory.title;
}

function StoriesGridItem({
  memory,
  isMobile,
  index,
}: {
  memory: IMemory;
  isMobile: boolean;
  index: number;
}) {
  const { open } = useModal();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isMobile) {
        e.preventDefault();
        open("view-memory", { memoryId: memory._id });
      }
    },
    [isMobile, open, memory._id],
  );

  const stopMenuBubble = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const bannerMedia = memory.attachments.find(
    (a) => a.type.includes("image") || a.type.includes("video"),
  );
  const audioMedia = memory.attachments.find((a) => a.type.includes("audio"));
  const aspectClass = MEDIA_ASPECTS[index % MEDIA_ASPECTS.length];
  const textMinH = TEXT_MIN_HEIGHTS[index % TEXT_MIN_HEIGHTS.length];
  const storyTitle = getStoryCardTitle(memory);

  const renderContent = () => {
    if (bannerMedia) {
      const isVideo = bannerMedia.type.includes("video");
      return (
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker shadow-sm",
            aspectClass,
          )}
        >
          <QuickCaptureProcessingBadge memory={memory} variant="overlay" />
          <img
            src={bannerMedia.url}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
            alt={storyTitle}
            loading="lazy"
          />
          {isVideo ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity group-hover/card:bg-black/25">
              <div className="rounded-full border border-white/40 bg-white/30 p-3 shadow-lg backdrop-blur-md">
                <PlaySolidIcon className="size-8 text-white" />
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (audioMedia) {
      return (
        <div
          className={cn(
            "relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-v3-stroke-weak bg-v3-fill-strong shadow-sm",
            aspectClass,
          )}
        >
          <QuickCaptureProcessingBadge memory={memory} variant="overlay" />
          <img
            src={recordBanner}
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
            alt=""
            loading="lazy"
          />
          <div className="relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
            <WaveIcon className="h-auto w-16 text-white opacity-80" />
            <span className="font-inter text-sm font-semibold tracking-widest text-white">
              {audioMedia.duration ?
                dayjs().startOf("day").add(audioMedia.duration, "second").format("HH:mm:ss") :
                "00:00:00"}
            </span>
          </div>
        </div>
      );
    }

    const hasSummary = Boolean(memory.summary?.trim());
    const hasTopics = Array.isArray(memory.topics) && memory.topics.length > 0;

    return (
      <div
        className={cn(
          "relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300",
          "backdrop-blur-md bg-white/40 border border-white/40 hover:border-white/60 hover:bg-white/50",
          textMinH,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="line-clamp-2 font-inter text-base font-semibold leading-snug text-v3-text-strong">
            {storyTitle}
          </h4>
          <QuickCaptureProcessingBadge memory={memory} variant="inline" />
        </div>

        {hasSummary ? (
          <div className="rounded-xl border-l-[3px] border-v3-brand-strong bg-white/20 px-3 py-2 my-0.5">
            <p className="font-georgia italic text-xs leading-relaxed text-v3-text-strong">
              "{memory.summary?.trim()}"
            </p>
          </div>
        ) : null}

        {hasTopics ? (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {memory.topics?.map((topic) => {
              const colors = getTopicColor(topic);
              return (
                <span
                  key={topic}
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  className="inline-flex items-center rounded-full border px-2 py-0.5 font-inter text-[10px] font-medium transition-colors"
                >
                  #{topic}
                </span>
              );
            })}
          </div>
        ) : null}

        <div
          className={cn(
            "font-inter text-sm leading-relaxed text-v3-text-weak [&_a]:underline",
            hasSummary ? "line-clamp-[4]" : "line-clamp-[8]"
          )}
          dangerouslySetInnerHTML={{
            __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(memory?.body || "")),
          }}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 mt-auto h-16 w-full bg-gradient-to-t from-white/40 to-transparent" />
      </div>
    );
  };

  return (
    <article
      className={cn(
        "group/card relative mb-4 w-full break-inside-avoid sm:mb-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-strong/5",
        "focus-within:ring-2 focus-within:ring-v3-brand-strong/40 focus-within:ring-offset-2",
      )}
    >
      <Link
        to={`/stories/${memory._id}`}
        className="block rounded-2xl outline-none"
        onClick={handleClick}
        aria-label={`Open story: ${storyTitle}`}
      >
        <div className="relative overflow-hidden rounded-2xl">
          {renderContent()}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/55 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            aria-hidden
          />
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <span className="inline-flex items-center rounded-full bg-white px-4 py-2 font-inter text-sm font-semibold text-neutral-900 shadow-lg ring-1 ring-black/5">
              Open story
            </span>
          </div>
        </div>
      </Link>

      <div
        className="absolute top-2 right-2 z-20 opacity-0 transition-opacity duration-300 group-hover/card:pointer-events-auto group-hover/card:opacity-100 pointer-events-none sm:top-3 sm:right-3"
        onClick={stopMenuBubble}
        onKeyDown={stopMenuBubble}
      >
        <div className="overflow-hidden rounded-xl border border-v3-stroke-weak bg-white/95 shadow-lg backdrop-blur-sm">
          <MemoryItemActions memory={memory} />
        </div>
      </div>

      <p className="mt-2 line-clamp-2 px-0.5 text-center font-inter text-xs font-medium leading-snug text-v3-text-strong sm:text-[13px]">
        {storyTitle}
      </p>
    </article>
  );
}

export default function StoriesGrid({ data }: { data: IPagination<IMemory> }) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!data?.docs || data.docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-v3-fill-weaker">
          <DoubleHeartIcon className="size-8 stroke-2 text-v3-text-weaker" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-v3-text-strong">No stories yet</h3>
        <p className="max-w-xs text-sm text-v3-text-weak">
          Start creating your first story to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full columns-2 gap-3 sm:columns-2 sm:gap-4 md:columns-3 lg:columns-4 lg:gap-5 xl:gap-6 [column-fill:_balance]">
      {data.docs.map((m, i) => (
        <StoriesGridItem key={m._id ?? i} memory={m} isMobile={isMobile} index={i} />
      ))}
    </div>
  );
}
