import type { ComponentProps, ReactNode } from "react";
import useSWR from "swr";
import DOMPurify from "isomorphic-dompurify";
import { useModal } from "@/hooks/use-modal";
import endpoint from "@/api/endpoint";
import type { IMemory } from "@/utility/interface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function StoryDetailsDialog({
  memory,
  open,
  onOpenChange,
  onCloseAutoFocus,
  children,
}: {
  memory: IMemory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[200] bg-overlay-backdrop motion-reduce:animate-none"
        className="z-[210] max-h-[calc(100dvh-48px)] overflow-y-auto rounded-3xl border border-stroke-neutral-weak bg-bg-neutral-solid p-7 text-text-neutral-strong motion-reduce:animate-none"
        onEscapeKeyDown={(event) => event.stopPropagation()}
        onCloseAutoFocus={onCloseAutoFocus}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="pr-8 font-geist text-2xl font-semibold">
            Story Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Visibility, tags, and an overview of this story.
          </DialogDescription>
        </DialogHeader>
        {children ?? <StoryDetailsContent memory={memory} />}
      </DialogContent>
    </Dialog>
  );
}

/** All existing details entry points use the same dialog as the story viewer. */
export function ViewMemoryDetails({
  data: { memory: initialMemory },
}: {
  data: { memory: IMemory };
}) {
  const { close } = useModal();
  const { data: fetched } = useSWR(
    initialMemory?._id ? `${endpoint.memories}/${initialMemory._id}` : null,
  );
  const memory = (fetched?.data as IMemory | undefined) ?? initialMemory;
  return (
    <StoryDetailsDialog
      memory={memory}
      open
      onOpenChange={(open) => {
        if (!open) close?.("view-memory-details");
      }}
    />
  );
}

export function StoryDetailsContent({ memory }: { memory: IMemory }) {
  const words = DOMPurify.sanitize(memory.body)
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const audience = [...(memory.groups ?? []), ...(memory.beneficiaries ?? [])];

  return (
    <div className="flex flex-col gap-7 font-geist">
      <section>
        <h3 className="text-base font-semibold text-text-neutral-strong">
          Visibility
        </h3>
        <p className="mt-2 text-sm text-text-neutral-weak">
          {memory.visibility === "everyone"
            ? "Visible to everyone"
            : audience.length > 0
              ? `Shared with ${audience.map((item) => item.name).join(", ")}`
              : "Private — only you"}
        </p>
      </section>
      <section>
        <h3 className="text-base font-semibold text-text-neutral-strong">
          Story Overview
        </h3>
        <div className="mt-2 space-y-2 text-sm text-text-neutral-weak">
          <p>
            {memory.attachments.length}{" "}
            {memory.attachments.length === 1 ? "attachment" : "attachments"}
          </p>
          <p>
            {words === 0 ? 0 : Math.max(1, Math.ceil(words / 200))} min read
          </p>
        </div>
      </section>
      <section>
        <h3 className="text-base font-semibold text-text-neutral-strong">
          Tags
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {memory.tags.length > 0 ? (
            memory.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak px-2.5 py-1 text-xs text-text-neutral-strong"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))
          ) : (
            <span className="text-sm text-text-neutral-weaker">No tags</span>
          )}
        </div>
      </section>
    </div>
  );
}
