import { storyDestination } from "@/lib/story-destination";
import { DeletedMemoryStatus } from "./deleted-memory-status";
import DOMPurify from "isomorphic-dompurify";
import { DoubleHeartIcon } from "@/components/icons";
import { ensureLinksOpenInNewTab } from "@/utility";
import { MemoryItemActions } from "./dropdown";
import type { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import { QuickCaptureProcessingBadge } from "@/components/memory/quick-capture-processing-badge";
import { StoriesLoadMore } from "./load-more";
import Spinner from "@/components/spinner";
import VideoThumbnail from "@/components/video-thumbnail";
import { classifyConversationFile } from "@/pages/dashboard/chat/conversation/conversation-assets";

import { PlaySolidIcon, WaveIcon } from "@/components/icons";
import recordBanner from "@/assets/icon/record-banner.png";
import {
  getCardSeed,
  hasAtLeastRenderedBodyLines,
  pickBySeed,
} from "./grid-helpers";

const DEFAULT_VIEWPORT_WIDTH = 1280;
const MEDIA_CARD_ASPECTS = ["aspect-[4/5]", "aspect-[5/6]", "aspect-[3/4]", "aspect-square"] as const;
const TEXT_BODY_CLAMPS = ["line-clamp-[5]", "line-clamp-[7]", "line-clamp-[9]"] as const;
const TEXT_CARD_MIN_HEIGHTS = ["min-h-[206px]", "min-h-[232px]", "min-h-[264px]"] as const;
// A phone-width 3:4 card holds seven lines under a two-line title.
const MOBILE_TEXT_BODY_CLAMPS = ["line-clamp-[5]", "line-clamp-[6]", "line-clamp-[7]"] as const;

function getStoryKey(memory: IMemory, index: number) {
  return memory._id || `${memory.createdAt || "story"}-${index}`;
}

function getMasonryConfig(width: number) {
  if (width >= 1800) {
    return { columns: 6, gutter: 24 };
  }
  if (width >= 1536) {
    return { columns: 5, gutter: 24 };
  }
  if (width >= 1024) {
    return { columns: 4, gutter: 24 };
  }
  if (width >= 768) {
    return { columns: 3, gutter: 20 };
  }
  if (width >= 640) {
    return { columns: 2, gutter: 20 };
  }
  return { columns: 2, gutter: 12 };
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
  onMeasure,
}: {
  memory: IMemory;
  isMobile: boolean;
  onMeasure?: (node: HTMLElement | null) => void;
}) {
  const { open } = useModal();
  const textBodyRef = useRef<HTMLDivElement | null>(null);
  const [isTallTextCard, setIsTallTextCard] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (memory.status === "deleted") { e.preventDefault(); return; }
      if (!isMobile && !memory.prompt_type) {
        e.preventDefault();
        open("view-memory", { memoryId: memory._id });
      }
    },
    [isMobile, open, memory._id, memory.status, memory.prompt_type],
  );

  const bannerMediaIndex = memory.attachments.findIndex(
    (a) => ["image", "video"].includes(classifyConversationFile(a)),
  );
  const bannerMedia = memory.attachments[bannerMediaIndex];
  const audioMediaIndex = memory.attachments.findIndex((a) =>
    classifyConversationFile(a) === "audio",
  );
  const audioMedia = memory.attachments[audioMediaIndex];
  const storyTitle = getStoryCardTitle(memory);
  const cardSeed = getCardSeed(memory, storyTitle);
  const mediaAspectClass = pickBySeed(MEDIA_CARD_ASPECTS, cardSeed);
  const cardRadiusClass = isMobile ? "rounded-2xl" : "rounded-[20px]";
  const textBodyClampClass = pickBySeed(isMobile ? MOBILE_TEXT_BODY_CLAMPS : TEXT_BODY_CLAMPS, cardSeed);
  const textCardMinHeightClass = pickBySeed(TEXT_CARD_MIN_HEIGHTS, cardSeed);

  useLayoutEffect(() => {
    const body = textBodyRef.current;
    if (!body || bannerMedia || audioMedia) return;

    const measure = () => {
      setIsTallTextCard(hasAtLeastRenderedBodyLines(body));
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [audioMedia, bannerMedia, memory.body]);

  const renderMediaCounter = (activeIndex: number) =>
    memory.attachments.length > 1 ? (
      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1.5 font-inter text-sm font-medium text-white backdrop-blur-sm">
        {activeIndex + 1}/{memory.attachments.length}
      </span>
    ) : null;

  const renderContent = () => {
    if (bannerMedia) {
      const isVideo = classifyConversationFile(bannerMedia) === "video";
      return (
        <div
          className={cn(
            "relative w-full overflow-hidden border border-v3-stroke-weak bg-v3-fill-weaker shadow-sm transition-[filter] duration-150 motion-reduce:transition-none group-hover/card:brightness-[0.97]",
            cardRadiusClass,
            mediaAspectClass,
          )}
        >
          <QuickCaptureProcessingBadge
            memory={memory}
            variant="overlay"
            className={memory.attachments.length > 1 ? "top-12" : undefined}
          />
          {renderMediaCounter(bannerMediaIndex)}
          {isVideo ? <VideoThumbnail key={bannerMedia._id} file={bannerMedia} label={storyTitle} memoryId={memory._id} className="h-full w-full object-cover" /> : <img
            src={bannerMedia.url}
            className="h-full w-full object-cover"
            alt={storyTitle}
            loading="lazy"
          />}
          {isVideo ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-150 motion-reduce:transition-none group-hover/card:bg-black/25">
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
            "relative flex w-full items-center justify-center overflow-hidden border border-v3-stroke-weak bg-v3-fill-strong shadow-sm transition-[filter] duration-150 motion-reduce:transition-none group-hover/card:brightness-[0.97]",
            cardRadiusClass,
            mediaAspectClass,
          )}
        >
          <QuickCaptureProcessingBadge
            memory={memory}
            variant="overlay"
            className={memory.attachments.length > 1 ? "top-12" : undefined}
          />
          {renderMediaCounter(audioMediaIndex)}
          <img
            src={recordBanner}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            alt=""
            loading="lazy"
          />
          <div className={cn("relative z-10 flex flex-col items-center gap-3 border border-white/20 bg-white/10 p-5 backdrop-blur-md", cardRadiusClass)}>
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

    return (
      <div
        data-slot="story-text-card"
        className={cn(
          "relative flex w-full flex-col overflow-hidden border border-stroke-neutral-weaker shadow-sm transition-[filter] duration-150 motion-reduce:transition-none group-hover/card:brightness-[0.97]",
          "backdrop-blur-md",
          cardRadiusClass,
          "bg-fill-neutral-weak",
          isMobile ? "gap-2 p-3.5" : "gap-3 p-5",
          isTallTextCard ? "aspect-[3/4]" : textCardMinHeightClass,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={cn("line-clamp-2 font-inter font-semibold leading-snug text-v3-text-strong", isMobile ? "text-sm" : "text-base")}>
            {storyTitle}
          </h4>
          <QuickCaptureProcessingBadge memory={memory} variant="inline" />
        </div>

        <div
          ref={textBodyRef}
          data-slot="story-text-body"
          className={cn(
            "font-inter leading-relaxed text-v3-text-weak [&_a]:underline",
            isMobile ? "text-xs" : "text-sm",
            textBodyClampClass,
          )}
          dangerouslySetInnerHTML={{
            __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(memory?.body || "")),
          }}
        />


      </div>
    );
  };

  return (
    <article
      ref={onMeasure}
      className="group/card relative w-full"
    >
      <Link
        to={storyDestination(memory)}
        className={cn("block outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong", cardRadiusClass)}
        onClick={handleClick}
        aria-disabled={memory.status === "deleted" || undefined}
        aria-label={`Open story: ${storyTitle}`}
      >
        <div className={cn("relative overflow-hidden", cardRadiusClass)}>
          {renderContent()}
          <div
            data-slot="story-hover-overlay"
            className={cn("pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-hover/card:opacity-100", cardRadiusClass)}
            aria-hidden
          />
        </div>
      </Link>

      <div
        data-slot="story-card-caption"
        className={cn("mt-2 flex items-center px-0.5", isMobile ? "gap-1" : "gap-8")}
      >
        <p className="min-w-0 flex-1 truncate text-left font-inter text-xs font-medium leading-snug text-v3-text-strong sm:text-[13px]">
          {storyTitle}
        </p>
        <div data-slot="story-card-menu" className="shrink-0">
          <MemoryItemActions memory={memory} trigger="horizontal" />
        </div>
      </div>
      {memory.status === "deleted" && <div className="mt-1 px-0.5"><DeletedMemoryStatus memory={memory} showDeletedAt /></div>}
    </article>
  );
}

interface StoriesGridProps {
  data?: IPagination<IMemory>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export default function StoriesGrid({
  data,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
}: StoriesGridProps) {
  const [viewportWidth, setViewportWidth] = useState(
    () => typeof window !== "undefined" ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH,
  );
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const observedNodesRef = useRef(new Map<string, HTMLElement>());
  const stories = useMemo(() => data?.docs ?? [], [data?.docs]);
  const { columns: columnsCount, gutter } = getMasonryConfig(viewportWidth);
  const isMobile = viewportWidth < 640;
  useEffect(() => {
    const check = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      setMeasuredHeights((prev) => {
        let next = prev;

        for (const entry of entries) {
          const key = entry.target.getAttribute("data-story-key");
          if (!key) continue;

          const height = Math.ceil(entry.contentRect.height);
          if (prev[key] === height) continue;

          if (next === prev) {
            next = { ...prev };
          }
          next[key] = height;
        }

        return next;
      });
    });

    resizeObserverRef.current = observer;

    for (const node of observedNodesRef.current.values()) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

  const registerMeasuredNode = useCallback((key: string, node: HTMLElement | null) => {
    const observer = resizeObserverRef.current;
    const previousNode = observedNodesRef.current.get(key);

    if (previousNode && observer) {
      observer.unobserve(previousNode);
    }

    if (!node) {
      observedNodesRef.current.delete(key);
      return;
    }

    node.setAttribute("data-story-key", key);
    observedNodesRef.current.set(key, node);
    observer?.observe(node);

    const height = Math.ceil(node.getBoundingClientRect().height);
    setMeasuredHeights((prev) => prev[key] === height ? prev : { ...prev, [key]: height });
  }, []);

  const storiesByColumn = useMemo(() => {
    const columns = Array.from({ length: columnsCount }, () => [] as Array<{
      memory: IMemory;
      key: string;
    }>);
    const columnHeights = Array(columnsCount).fill(0);

    stories.forEach((memory, index) => {
      const key = getStoryKey(memory, index);
      const measuredHeight = measuredHeights[key];
      const targetColumnIndex =
        measuredHeight == null
          ? index % columnsCount
          : columnHeights.indexOf(Math.min(...columnHeights));

      columns[targetColumnIndex].push({ memory, key });
      columnHeights[targetColumnIndex] += measuredHeight ?? 0;
    });

    return columns;
  }, [columnsCount, measuredHeights, stories]);

  if (stories.length === 0 && !isLoadingMore) {
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
    <div className="flex w-full flex-col gap-6">
      {stories.length > 0 ? (
        <div
          className="flex w-full items-start"
          style={{ gap: `${gutter}px` }}
        >
          {storiesByColumn.map((column, columnIndex) => (
            <div
              key={`stories-column-${columnIndex}`}
              className="flex min-w-0 flex-1 flex-col"
              style={{ gap: `${gutter}px` }}
            >
              {column.map(({ memory, key }) => (
                <StoriesGridItem
                  key={key}
                  memory={memory}
                  isMobile={isMobile}
                  onMeasure={(node) => registerMeasuredNode(key, node)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner loading />
        </div>
      )}

      <StoriesLoadMore
        slot="stories-grid-load-more"
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        onRetry={onRetry}
      />
    </div>
  );
}
