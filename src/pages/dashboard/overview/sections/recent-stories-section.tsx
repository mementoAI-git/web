import { storyDestination } from "@/lib/story-destination";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import dayjs from "dayjs";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";
import { StoryListThumbnail } from "@/pages/dashboard/stories/components/list-thumbnail";
import type { IMemory } from "@/utility/interface";

interface StoriesResponse {
  data?: { docs?: IMemory[] };
}

function formatStoryDate(date: string) {
  const day = dayjs(date);
  const now = dayjs();
  const time = day.format("h:mm A");
  if (day.isSame(now, "day")) return `Today · ${time}`;
  if (day.isSame(now.subtract(1, "day"), "day")) return `Yesterday · ${time}`;
  return `${day.format("MMM D")} · ${time}`;
}

export default function RecentStoriesSection() {
  // The memories endpoint returns saved stories newest first, excluding drafts and deleted stories.
  const { data, isLoading, error, mutate } = useSWR<StoriesResponse>(
    `${endpoint.memories}?page=1&limit=5&sort=-created_at`,
  );
  const stories = (data?.data?.docs ?? []).slice(0, 5);
  const { open } = useModal();

  return (
    <section
      className="flex min-w-0 flex-col gap-3 sm:gap-4"
      aria-labelledby="recent-stories-heading"
    >
      <header className="flex items-center justify-between gap-3">
        <TypographyH2
          id="recent-stories-heading"
          className="font-garamond text-[28px] font-normal leading-tight text-text-neutral-strong sm:text-[32px] lg:text-[32px]"
        >
          Recent <i className="text-text-neutral-weaker">stories</i>
        </TypographyH2>
        <Button
          variant="link"
          asChild
          className="min-h-11 px-0 font-inter text-sm font-medium text-text-brand-strong motion-reduce:transform-none motion-reduce:transition-none"
        >
          <Link to="/stories">See all</Link>
        </Button>
      </header>
      {isLoading ? (
        <div
          aria-label="Loading recent stories"
          role="status"
          className="divide-y divide-stroke-neutral-weaker"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="size-10 shrink-0 rounded-lg motion-reduce:animate-none" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : error && !data ? (
        <div role="alert" className="py-6 text-center">
          <TypographyMuted>
            We couldn’t load your stories. Please try again.
          </TypographyMuted>
          <Button
            variant="link"
            onClick={() => void mutate().catch(() => undefined)}
          >
            Try again
          </Button>
        </div>
      ) : stories.length ? (
        <ul className="divide-y divide-stroke-neutral-weaker">
          {stories.map((story) => (
            <li key={story._id}>
              <Link
                to={storyDestination(story)}
                className="flex min-h-11 items-center gap-3 rounded-xl py-3 outline-none transition-colors hover:bg-fill-neutral-weaker focus-visible:ring-2 focus-visible:ring-stroke-brand-strong motion-reduce:transition-none"
              >
                <StoryListThumbnail memory={story} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-inter text-base text-text-neutral-strong">
                    {(story.prompt_type && story.prompt_text?.trim()) ||
                      story.title ||
                      "Untitled story"}
                  </p>
                  <time
                    dateTime={story.created_at}
                    className="font-inter text-xs text-text-neutral-weak"
                  >
                    {formatStoryDate(story.created_at)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="sky-card flex flex-col items-center gap-4 rounded-[16px] border border-stroke-neutral-weak bg-fill-neutral-weaker px-6 py-[51px] text-center">
          <TypographyMuted className="font-inter text-sm text-text-neutral-weak">
            No stories added yet
          </TypographyMuted>
          <Button
            type="button"
            size="lg"
            className="rounded-[64px]"
            onClick={() => open?.("create-memory")}
          >
            <Plus className="size-5 shrink-0" aria-hidden /> Add story
          </Button>
        </div>
      )}
    </section>
  );
}
