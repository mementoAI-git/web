import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/utility";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useModal } from "@/hooks/use-modal";
import { useBookmark } from "@/hooks/use-bookmark";
import endpoint from "@/api/endpoint";
import { resolveExploreCatalog } from "@/features/explore/explore-catalog";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import { resolveExploreCategorySlug } from "@/utility/data/categories";
import type { IMemory } from "@/utility/interface";
import back from "@/assets/icon/explore-topic/back.svg";
import share from "@/assets/icon/explore-topic/share.svg";
import bookmark from "@/assets/icon/explore-topic/bookmark.svg";
import chevron from "@/assets/icon/explore-topic/chevron-down.svg";

function TopicIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-6 shrink-0 bg-current"
      style={{
        maskImage: `url("${src}")`,
        maskSize: "24px 24px",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

export default function TopicHeader({ memory }: { memory: IMemory }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: promptDetails } = useSWR(
    memory?.prompt
      ? `${endpoint.promptDetails}${memory.prompt}`
      : memory?.prompt_type
        ? null
        : id
          ? `${endpoint.promptDetails}${id}`
          : null,
  );
  const { open } = useModal();
  const { toggleBookmark, isLoading } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: Boolean(memory?.bookmarked),
    onSuccess: () => {
      if (id) void mutate(`${endpoint.memoryPrompt}/${id}`);
    },
  });
  const categoryValue = promptDetails?.data?.category || memory?.category;
  const slug = resolveExploreCategorySlug(categoryValue);
  const category = resolveExploreCatalog(null).categories.find(
    (item) => item.slug === slug,
  );
  const actions = (
    <div className="flex shrink-0 items-center gap-1 text-icon-neutral-weak sm:gap-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Share topic"
        disabled={!memory?._id}
        onClick={() =>
          open("share-post", { id: memory._id, kind: "conversation" })
        }
      >
        <TopicIcon src={share} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={
          memory?.bookmarked ? "Remove topic bookmark" : "Bookmark topic"
        }
        aria-pressed={Boolean(memory?.bookmarked)}
        disabled={isLoading || !memory?._id}
        onClick={() => void toggleBookmark()}
        className={
          memory?.bookmarked
            ? "text-icon-info-strong bg-fill-info-weak"
            : undefined
        }
      >
        <TopicIcon src={bookmark} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={collapsed ? "Expand topic card" : "Collapse topic card"}
        aria-expanded={!collapsed}
        aria-controls="topic-question-card"
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className={cn("flex", collapsed && "rotate-180")}>
          <TopicIcon src={chevron} />
        </span>
      </Button>
    </div>
  );
  const image = (
    <img
      src={getQuestionIdenticonUrl(id || "")}
      alt=""
      width={collapsed ? 40 : 56}
      height={collapsed ? 40 : 56}
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn(
        "shrink-0 bg-fill-neutral-weak object-cover",
        collapsed ? "size-10 rounded-md" : "size-14 rounded-lg",
      )}
    />
  );
  return (
    <div
      className="flex w-full shrink-0 flex-col gap-6"
      data-testid="topic-header"
    >
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="relative z-[46] h-9 self-start gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-neutral-strong"
      >
        <TopicIcon src={back} />
        Back
      </Button>
      <section
        id="topic-question-card"
        aria-label="Topic question"
        className={cn(
          "sky-card rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weaker",
          collapsed
            ? "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 p-[15px]"
            : "flex flex-col gap-6 p-[15px] sm:p-[23px]",
        )}
      >
        {collapsed ? (
          <>
            {image}
            <h1 className="min-w-0 line-clamp-2 font-garamond text-xl font-normal leading-6 text-text-neutral-strong sm:text-2xl sm:leading-7">
              {memory?.prompt_text || memory?.title}
            </h1>
            {actions}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <Badge className="h-auto min-w-0 whitespace-normal rounded-sm border-0 bg-fill-brand-weak px-2 py-1 text-sm font-medium leading-6 text-text-brand-strong sm:text-base">
                {category?.title ||
                  categoryValue ||
                  (memory?.prompt_type ? "Daily reflection" : "Explore topics")}
              </Badge>
              {actions}
            </div>
            <div className="flex items-start justify-between gap-4 sm:gap-6">
              <h1 className="min-w-0 max-w-[680px] flex-1 font-garamond text-2xl font-normal leading-7 text-text-neutral-strong">
                {memory?.prompt_text || memory?.title}
              </h1>
              {image}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
