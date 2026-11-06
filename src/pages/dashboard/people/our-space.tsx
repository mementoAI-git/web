import Bubble from "../chat/conversation/bubble";
import { ContributionDialog } from "./contribution-dialog";
import { SharedItemDialog } from "./shared-item-dialog";
import { SharedMedia } from "./shared-media";
import { SharedMemoryLink } from "./shared-memory-link";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, BookOpen, MoreHorizontal } from "lucide-react";
import useSWR from "swr";
import DOMPurify from "isomorphic-dompurify";
import {
  getSpace,
  spaceFilters,
  type Person,
  type SharedItem,
  type SpaceFilter,
  type TalkTurn,
} from "@/api/people";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";

const CHAT_ATTACHMENT_BODY = "Shared an attachment";
const CHAT_ATTACHMENT_TITLE = "Shared attachment";

function plainBody(body: string) {
  return DOMPurify.sanitize(
    body.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, "\n"),
    { ALLOWED_TAGS: [], ALLOWED_ATTR: [] },
  );
}

/** What someone typed when sending an item from chat, without the placeholders that fill empty messages. */
function chatMessageText(item: SharedItem) {
  const body = plainBody(item.body).trim();
  const text = body === CHAT_ATTACHMENT_BODY ? "" : body;
  const titled =
    item.title !== CHAT_ATTACHMENT_TITLE &&
    item.title !== body.slice(0, 80);
  return titled ? `**${item.title}**\n\n${text}`.trim() : text;
}

export function OurSpace({
  person,
  onTalk,
  embedded = false,
  chatTurns = [],
}: {
  person: Person;
  onTalk?: (id: string, title: string) => void;
  embedded?: boolean;
  chatTurns?: TalkTurn[];
}) {
  const { user } = useStore();
  const { open } = useModal();
  const [filter, setFilter] = useState<SpaceFilter>("All");
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    user?._id ? ["people-space", user._id, person.user_id, page, filter] : null,
    () => getSpace(person.user_id, page, filter),
    { shouldRetryOnError: false, refreshInterval: 15000 },
  );
  const retry = useRequestRecovery(
    `people-space:${person.user_id}:${page}:${filter}`,
    error,
    mutate,
    "Couldn’t load your shared memories. Please try again.",
  );
  const recoveringPage = Boolean(
    data && !error && !data.items.length && page > 1,
  );
  useEffect(() => {
    if (recoveringPage) setPage((current) => Math.max(1, current - 1));
  }, [recoveringPage, page]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const add = () => setAdding(true);
  const entries = [
    ...(data?.items || []).map((item) => ({
      kind: "memory" as const,
      item,
      date: item.shared_date || item.original_date,
    })),
    ...(embedded && filter === "All" && page === 1
      ? chatTurns.filter(
          (turn) => turn.role !== "user" || !turn.shared_input_id,
        )
      : []
    ).map((turn) => ({ kind: "turn" as const, turn, date: turn.created_at })),
  ];
  if (embedded)
    entries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-1 flex-col",
        embedded ? "py-4" : "px-5 py-7 sm:px-9",
      )}
    >
      {adding && (
        <ContributionDialog
          person={person}
          onClose={() => setAdding(false)}
          onSaved={() => {
            void mutate().catch(() => undefined);
          }}
        />
      )}
      {detail && (
        <SharedItemDialog
          person={person}
          sourceId={detail}
          sharedChat={embedded}
          confirmRemoval={removing}
          onClose={() => {
            setDetail(null);
            setRemoving(false);
          }}
          onRemoved={() => {
            void mutate().catch(() => undefined);
          }}
          onTalk={onTalk}
        />
      )}
      {!embedded && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stroke-neutral-weak pb-5">
            <div>
              <h2 className="font-garamond text-3xl font-medium text-text-neutral-strong">
                Our Space
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-neutral-weak">
                Your shared memories.
              </p>
            </div>
            <Button
              size="form"
              variant="outline"
              className="people-control"
              onClick={add}
            >
              <Plus aria-hidden />
              Add memory
            </Button>
          </div>
          <div
            role="group"
            aria-label="Filter shared memories"
            className="my-6 flex flex-wrap gap-1"
          >
            {spaceFilters.map((value) => (
              <Button
                key={value}
                size="sm"
                variant="ghost"
                aria-pressed={filter === value}
                className={cn(
                  "people-control",
                  filter === value &&
                    "bg-bg-neutral text-text-neutral-strong ring-1 ring-stroke-neutral-weak",
                )}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                {value}
              </Button>
            ))}
          </div>
        </>
      )}
      {error ? (
        <div className="rounded-2xl border border-stroke-neutral-weak bg-bg-neutral px-6 py-10 text-center">
          <Button
            size="form"
            variant="outline"
            onClick={retry}
            disabled={isValidating}
          >
            Retry loading shared memories
          </Button>
        </div>
      ) : isLoading || !user?._id || recoveringPage ? (
        <div
          role="status"
          aria-label="Loading shared memories"
          className="space-y-6"
        >
          {[0, 1].map((index) => (
            <Skeleton
              key={index}
              className="h-32 rounded-xl motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : !entries.length ? (
        embedded ? null : (
          <Empty className="min-h-64 rounded-2xl border border-dashed border-stroke-neutral-weak bg-bg-neutral px-6 py-10">
            <BookOpen className="size-6 text-icon-neutral-weaker" aria-hidden />
            <EmptyHeader>
              <EmptyTitle className="text-2xl">
                {filter === "All"
                  ? "Nothing here yet."
                  : `No ${filter.toLowerCase()} here yet.`}
              </EmptyTitle>
              <EmptyDescription>
                Add memory you want the two of you to keep together.
              </EmptyDescription>
            </EmptyHeader>
            {filter === "All" && (
              <Button
                size="form"
                variant="outline"
                className="people-control"
                onClick={add}
              >
                Add memory
              </Button>
            )}
          </Empty>
        )
      ) : (
        <ol
          aria-label={
            embedded
              ? "Connection conversation and shared memories"
              : "Shared memories"
          }
          className={
            embedded
              ? "space-y-5"
              : "overflow-hidden rounded-2xl border border-stroke-neutral-weak bg-bg-neutral"
          }
        >
          {entries.map((entry) => {
            if (entry.kind === "turn") {
              const turn = entry.turn;
              return (
                <li key={`turn:${turn.id}`}>
                  <Bubble
                    role={turn.role}
                    text={turn.text}
                    createdAt={turn.created_at}
                    is_voice={turn.is_voice}
                    attatchments={turn.attachments?.map((file) => ({
                      ...file,
                      name: file.name || "Attachment",
                    }))}
                  />
                  {!!turn.citations.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {turn.citations.map((citation) => (
                        <Button
                          key={citation.source_id}
                          variant="outline"
                          size="sm"
                          onClick={() => setDetail(citation.source_id)}
                        >
                          From Our Space · {citation.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              );
            }
            const item = entry.item;
            if (embedded) {
              const mine = item.contributor.user_id === user?._id;
              const remove = item.can_remove
                ? () => {
                    setRemoving(true);
                    setDetail(item.source_id);
                  }
                : undefined;
              if (item.source_type === "story")
                return (
                  <li key={item.source_id}>
                    <SharedMemoryLink
                      item={item}
                      mine={mine}
                      onTalk={onTalk}
                      onRemove={remove}
                    />
                  </li>
                );
              const pendingMedia = item.attachments.filter(
                (file) =>
                  file.status === "processing" || file.status === "failed",
              );
              return (
                <li key={item.source_id}>
                  {!mine && (
                    <p className="mb-1 px-1 text-xs text-text-neutral-weak">
                      {item.contributor.name}
                    </p>
                  )}
                  <Bubble
                    role={mine ? "user" : "ai"}
                    text={chatMessageText(item)}
                    createdAt={entry.date}
                    attatchments={item.attachments
                      .filter((file) => !pendingMedia.includes(file))
                      .map(({ _id, type, url, thumbnail }) => ({
                        _id,
                        type,
                        url,
                        thumbnail: thumbnail ?? undefined,
                        name: item.title || "Attachment",
                      }))}
                    metaActions={
                      remove ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="people-control size-7"
                              aria-label="Message actions"
                            >
                              <MoreHorizontal aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="people-menu bg-bg-neutral text-text-neutral-strong"
                          >
                            <DropdownMenuItem
                              className="text-text-error-strong"
                              onSelect={remove}
                            >
                              Remove message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : undefined
                    }
                  />
                  {pendingMedia.length > 0 && (
                    <p
                      className={cn(
                        "mt-1 px-1 text-xs",
                        mine && "text-right",
                        pendingMedia.some((file) => file.status === "failed")
                          ? "text-text-error-strong"
                          : "text-text-neutral-weak",
                      )}
                    >
                      {pendingMedia.some((file) => file.status === "failed")
                        ? "This media couldn’t be processed."
                        : "Media is still processing."}
                    </p>
                  )}
                </li>
              );
            }
            return (
              <li
                key={item.source_id}
                className="border-b border-stroke-neutral-weak px-5 py-6 last:border-b-0 sm:px-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-neutral-weaker">
                  <p>
                    <span className="font-medium text-text-neutral-weak">
                      {item.contributor.user_id === user?._id
                        ? "You"
                        : item.contributor.name}
                    </span>{" "}
                    {item.source_type === "story"
                      ? "shared a story"
                      : `added a ${item.source_type}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <time dateTime={item.shared_date || item.original_date}>
                      {new Date(
                        item.shared_date || item.original_date,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="people-control size-8"
                          aria-label={`Actions for ${item.title}`}
                        >
                          <MoreHorizontal aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="people-menu bg-bg-neutral text-text-neutral-strong"
                      >
                        <DropdownMenuItem
                          onSelect={() => setDetail(item.source_id)}
                        >
                          Open shared memory
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            open("view-memory", { memoryId: item.source_id })
                          }
                        >
                          View original memory
                        </DropdownMenuItem>
                        {person.memento_state === "active" && onTalk && (
                          <DropdownMenuItem
                            onSelect={() => onTalk(item.source_id, item.title)}
                          >
                            Talk about this memory
                          </DropdownMenuItem>
                        )}
                        {item.can_remove && (
                          <DropdownMenuItem
                            className="text-text-error-strong"
                            onSelect={() => {
                              setRemoving(true);
                              setDetail(item.source_id);
                            }}
                          >
                            Remove from Our Space
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <h3 className="mt-3 font-garamond text-2xl font-medium text-text-neutral-strong">
                  <button
                    type="button"
                    className="cursor-pointer text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stroke-brand-strong"
                    aria-label={`Open shared item: ${item.title}`}
                    onClick={() => setDetail(item.source_id)}
                  >
                    {item.title}
                  </button>
                </h3>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-text-neutral-weak">
                  {plainBody(item.body)}
                </p>
                <SharedMedia
                  attachments={item.attachments}
                  title={item.title}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-neutral-weaker">
                    {item.shared_via === "direct"
                      ? "Contributed from"
                      : "Shared from"}{" "}
                    {item.contributor.user_id === user?._id
                      ? "your"
                      : `${item.contributor.name}’s`}{" "}
                    Memento
                    {item.shared_via === "group_visibility"
                      ? " · via a group"
                      : ""}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="people-control"
                    onClick={() =>
                      open("view-memory", { memoryId: item.source_id })
                    }
                  >
                    View memory<span className="sr-only">: {item.title}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {data && !error && (page > 1 || data.has_next_page) && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            size="form"
            variant="outline"
            disabled={page === 1 || isLoading}
            onClick={() => setPage(page - 1)}
          >
            Newer memories
          </Button>
          <span className="text-xs text-text-neutral-weaker">Page {page}</span>
          <Button
            size="form"
            variant="outline"
            disabled={!data.has_next_page || isLoading}
            onClick={() => setPage(page + 1)}
          >
            Older memories
          </Button>
        </div>
      )}
    </div>
  );
}
