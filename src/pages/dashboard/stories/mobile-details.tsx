import { ChevronLeft, MoreHorizontal, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { StoryMobilePaper, StoryMobileReader } from "@/components/modal/memory/story-reader";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { addToRecentMemories, isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { DetailsSkeleton } from "./components/skeleton";
import { StoryActionsSheet } from "./story-actions-sheet";

const iconButtonClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-stroke-neutral-weaker bg-fill-neutral-weak text-text-neutral-weak";

/** The mobile app's story screen, on the album paper, for phones and tablets. */
export default function MobileStoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();
  const [actionsOpen, setActionsOpen] = useState(false);
  const { open } = useModal();
  const { data, error, isLoading } = useSWR(
    id ? `${endpoint.memories}/${id}` : null,
  );
  const memory = data?.data as IMemory;

  useEffect(() => {
    if (error && isEmpty(data) && !isLoading) {
      navigate("/stories");
    }
  }, [error, data, navigate, isLoading]);

  // Track when memory is opened
  useEffect(() => {
    if (data?.data && !isLoading) {
      addToRecentMemories(data.data, user?.email);
    }
  }, [data?.data, user?.email, isLoading]);

  if (isEmpty(memory)) return <DetailsSkeleton />;

  const goBack = () => {
    // A story opened straight from a link has nothing to go back to.
    if (location.key === "default") navigate("/stories");
    else navigate(-1);
  };

  return (
    <div className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <StoryMobilePaper />
      <header className="flex shrink-0 items-center gap-2 px-4 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" aria-label="Go back" onClick={goBack} className={iconButtonClass}>
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => open("edit-memory", { memory })}
          className="flex h-9 items-center gap-1.5 rounded-full border border-stroke-neutral-weaker bg-fill-neutral-weak px-3.5 font-inter text-sm font-medium leading-5 text-text-neutral-weak"
        >
          <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          Edit
        </button>
        <button
          type="button"
          aria-label="Story actions"
          onClick={() => setActionsOpen(true)}
          className={iconButtonClass}
        >
          <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </header>
      <StoryMobileReader
        title={memory.title}
        storyId={memory._id}
        createdAt={memory.created_at}
        body={memory.body}
        files={memory.attachments}
      />
      <StoryActionsSheet memory={memory} open={actionsOpen} onOpenChange={setActionsOpen} />
    </div>
  );
}
