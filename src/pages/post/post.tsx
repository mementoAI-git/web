import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoryJournalShell } from "@/components/modal/memory/story-journal-shell";
import {
  StoryMobileReader,
  StoryReaderColumn,
  StoryReaderContent,
  StoryReaderFrame,
  StoryReaderMedia,
  StoryReaderMeta,
} from "@/components/modal/memory/story-reader";
import { useStoryMobileViewport } from "@/components/modal/memory/story-reader-utils";
import {
  StoryDetailsContent,
  StoryDetailsDialog,
} from "@/components/modal/memory/view-details";
import { ListFilter } from "lucide-react";
import type { IPublicMemory } from "@/utility/interface";

/** A read-only version of the story viewer for people opening a shared link. */
export default function Post({ memory }: { memory: IPublicMemory }) {
  const isMobile = useStoryMobileViewport();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const detailsButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-haspopup="dialog"
      aria-expanded={detailsOpen}
      onClick={() => setDetailsOpen(true)}
      className="gap-2 font-geist font-semibold text-text-neutral-strong"
    >
      <ListFilter aria-hidden />
      Details
    </Button>
  );
  const meta = (
    <StoryReaderMeta createdAt={memory.created_at} body={memory.body} />
  );

  return (
    <>
      {isMobile ? (
        <StoryMobileReader
          title={memory.title}
          storyId={memory._id}
          createdAt={memory.created_at}
          body={memory.body}
          files={memory.attachments}
          readOnly
        />
      ) : (
        <StoryJournalShell presentation="page">
          <StoryReaderFrame meta={meta} actions={detailsButton}>
            <StoryReaderColumn>
              <StoryReaderContent title={memory.title} body={memory.body} />
            </StoryReaderColumn>
            <StoryReaderMedia files={memory.attachments} readOnly />
          </StoryReaderFrame>
        </StoryJournalShell>
      )}
      <StoryDetailsDialog
        memory={memory}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      >
        <StoryDetailsContent memory={memory} showVisibility={false} />
      </StoryDetailsDialog>
    </>
  );
}
