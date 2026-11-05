import { useId, useRef, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import { ClockCheck, MoreHorizontal } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { del, patch } from "@/api/mutations";
import { Button } from "@/components/ui/button";
import {
  FormDialog,
  FormDialogField,
  FormDialogFooter,
  FormDialogInput,
  FormDialogTextarea,
  FormDialogValue,
} from "@/components/modal/form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import type { InsightSource } from "./insights-api.types";
import { joinObservation } from "./observation-display";
import type { PersonaObservationSourcesResponse } from "./observations-api.types";

export interface ObservationItem {
  id: string;
  title: string;
  detail: string;
  /** The supporting text as stored; `detail` may be a generic fallback. */
  note: string;
}

// Together these stay within the API's 500 character limit.
const MAX_HEADING_LENGTH = 120;
const MAX_NOTE_LENGTH = 378;

const observationUrl = (id: string) =>
  endpoint.personaObservation.replace(":observationId", id);

function ObservationSources({
  id,
  onView,
}: {
  id: string;
  onView: (source: InsightSource) => void;
}) {
  const { data, error, isLoading, mutate } = useSWR<{
    data: PersonaObservationSourcesResponse;
  }>(`${observationUrl(id)}/sources`);
  if (error && !data)
    return (
      <div className="insights-sources-message">
        <p>Couldn’t load the sources.</p>
        <Button variant="outline" size="sm" onClick={() => void mutate()}>
          Retry
        </Button>
      </div>
    );
  if (isLoading && !data)
    return (
      <div className="insights-sources-message" role="status">
        <Spinner />
        Loading sources…
      </div>
    );
  const sources = data?.data?.sources ?? [];
  if (!sources.length)
    return (
      <p className="insights-sources-message">
        No linked sources. This was saved before Memento kept track of where
        things came from.
      </p>
    );
  return (
    <ul className="insights-sources-list" aria-label="Sources">
      {sources.map((source) => (
        <li key={source.id}>
          <button
            type="button"
            className="insights-source"
            aria-label={`View ${source.title}`}
            onClick={() => onView(source)}
          >
            {source.thumbnail ? (
              <img
                src={source.thumbnail}
                alt=""
                loading="lazy"
                className="insights-source-thumbnail object-cover"
              />
            ) : (
              <span className="insights-source-thumbnail" aria-hidden />
            )}
            <span className="min-w-0 flex-1 truncate text-left font-medium text-text-neutral-strong">
              {source.title}
            </span>
            {source.created_at && (
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-neutral-weak">
                <ClockCheck className="size-4" aria-hidden />
                {dayjs(source.created_at).format("MMM D, YYYY")}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function EditObservationDialog({
  item,
  onClose,
  onChanged,
}: {
  item: ObservationItem;
  onClose: () => void;
  onChanged: () => Promise<unknown>;
}) {
  const id = useId();
  const [heading, setHeading] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const [saving, setSaving] = useState(false);
  const changed =
    heading.trim() !== item.title.trim() || note.trim() !== item.note.trim();

  async function save() {
    setSaving(true);
    try {
      await patch(observationUrl(item.id), {
        content: joinObservation(heading, note),
      });
      await onChanged();
      toast.success("Note updated");
      onClose();
    } catch {
      toast.error("Couldn’t save your changes. Please try again.");
      setSaving(false);
    }
  }

  return (
    <FormDialog
      title="Edit this note"
      description="Put this note in your own words. Memento will use this version from now on."
      busy={saving}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <FormDialogField label="Heading" htmlFor={`${id}-heading`}>
          <FormDialogInput
            id={`${id}-heading`}
            value={heading}
            maxLength={MAX_HEADING_LENGTH}
            disabled={saving}
            onChange={(event) => setHeading(event.target.value)}
          />
        </FormDialogField>
        <FormDialogField label="Note" htmlFor={`${id}-note`}>
          <FormDialogTextarea
            id={`${id}-note`}
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            disabled={saving}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormDialogField>
        <FormDialogFooter
          submitLabel="Save changes"
          busyLabel="Saving…"
          busy={saving}
          disabled={!heading.trim() || !changed}
          dismissLabel={null}
          onDismiss={onClose}
        />
      </form>
    </FormDialog>
  );
}

function ForgetObservationDialog({
  item,
  onClose,
  onChanged,
}: {
  item: ObservationItem;
  onClose: () => void;
  onChanged: () => Promise<unknown>;
}) {
  const id = useId();
  const [forgetting, setForgetting] = useState(false);

  async function forget() {
    setForgetting(true);
    try {
      await del(observationUrl(item.id));
      await onChanged();
      toast.success("Note forgotten");
      onClose();
    } catch {
      toast.error("Couldn’t forget this note. Please try again.");
      setForgetting(false);
    }
  }

  return (
    <FormDialog
      title="Forget this note"
      description="Memento will stop using this note and won’t add it back. Your memories stay as they are."
      busy={forgetting}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <FormDialogField label="Heading" htmlFor={`${id}-heading`}>
          <FormDialogValue id={`${id}-heading`}>{item.title}</FormDialogValue>
        </FormDialogField>
        {item.note && (
          <FormDialogField label="Note" htmlFor={`${id}-note`}>
            <FormDialogValue id={`${id}-note`}>{item.note}</FormDialogValue>
          </FormDialogField>
        )}
        <FormDialogFooter
          submitLabel="Forget note"
          busyLabel="Forgetting…"
          busy={forgetting}
          dismissLabel="Keep"
          destructive
          onDismiss={onClose}
          onSubmit={() => void forget()}
        />
      </div>
    </FormDialog>
  );
}

type Action = "sources" | "edit" | "forget";

function ObservationCard({
  item,
  onViewSource,
  onChanged,
}: {
  item: ObservationItem;
  onViewSource: (source: InsightSource) => void;
  onChanged: () => Promise<unknown>;
}) {
  const [action, setAction] = useState<Action | null>(null);
  // Runs once the menu has closed, so it doesn't take focus from what opens.
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  return (
    <article className="insights-card insights-observation">
      <img
        src={getQuestionIdenticonUrl(item.id)}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="size-10 shrink-0 rounded-md bg-fill-neutral-weak object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-inter text-base font-medium text-text-neutral-strong">
          {item.title}
        </h3>
        {item.detail && (
          <p className="mt-1 truncate font-inter text-sm text-text-neutral-weak">
            {item.detail}
          </p>
        )}
      </div>
      <Popover
        open={action === "sources"}
        onOpenChange={(open) => !open && setAction(null)}
      >
        <DropdownMenu>
          <PopoverAnchor asChild>
            <DropdownMenuTrigger asChild>
              <Button
                ref={optionsButton}
                variant="ghost"
                size="icon"
                className="-mt-1 shrink-0 rounded-full"
                aria-label={`Options for ${item.title}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
          </PopoverAnchor>
          <DropdownMenuContent
            align="end"
            className="z-[120]"
            onCloseAutoFocus={(event) => {
              if (!pendingAction) return;
              event.preventDefault();
              // Dialogs return focus to whatever held it when they opened.
              optionsButton.current?.focus();
              setAction(pendingAction);
              setPendingAction(null);
            }}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setPendingAction("sources")}>
                Sources
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPendingAction("edit")}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setPendingAction("forget")}
              >
                Forget
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <PopoverContent
          align="end"
          collisionPadding={16}
          aria-label={`Sources for ${item.title}`}
          className="insights-sources-popup z-[120]"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            optionsButton.current?.focus();
          }}
        >
          <ObservationSources id={item.id} onView={onViewSource} />
        </PopoverContent>
      </Popover>
      {action === "edit" && (
        <EditObservationDialog
          item={item}
          onClose={() => setAction(null)}
          onChanged={onChanged}
        />
      )}
      {action === "forget" && (
        <ForgetObservationDialog
          item={item}
          onClose={() => setAction(null)}
          onChanged={onChanged}
        />
      )}
    </article>
  );
}

export function ObservationList({
  items,
  empty,
  onViewSource,
  onChanged,
}: {
  items: ObservationItem[];
  empty: ReactNode;
  onViewSource: (source: InsightSource) => void;
  onChanged: () => Promise<unknown>;
}) {
  if (!items.length) return empty;
  return (
    <div className="insights-list">
      {items.map((item) => (
        <ObservationCard
          key={item.id}
          item={item}
          onViewSource={onViewSource}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
