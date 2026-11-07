import {
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
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
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { getQuestionIdenticonUrl } from "@/features/explore/question-identicon";
import { observationUrl } from "./observation-sources";
import { ObservationSourcesPreview } from "./observation-sources-preview";
import { useSourcesPreview } from "./use-sources-preview";

export interface ObservationItem {
  id: string;
  title: string;
  detail: string;
  category: EnrichmentCategory;
}

const MAX_HEADING_LENGTH = 120;
const MAX_NOTE_LENGTH = 378;

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
  const [note, setNote] = useState(item.detail);
  const [saving, setSaving] = useState(false);
  const changed =
    heading.trim() !== item.title.trim() || note.trim() !== item.detail.trim();

  async function save() {
    setSaving(true);
    try {
      await patch(observationUrl(item.id), {
        heading: heading.trim(),
        note: note.trim(),
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
          disabled={!heading.trim() || !note.trim() || !changed}
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
        <FormDialogField label="Note" htmlFor={`${id}-note`}>
          <FormDialogValue id={`${id}-note`}>{item.detail}</FormDialogValue>
        </FormDialogField>
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

type Action = "edit" | "forget";

function ObservationCard({
  item,
  onOpen,
  onPreview,
  onPreviewEnd,
  onChanged,
}: {
  item: ObservationItem;
  onOpen: (item: ObservationItem) => void;
  onPreview: (item: ObservationItem, event: PointerEvent) => void;
  onPreviewEnd: () => void;
  onChanged: () => Promise<unknown>;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Runs once the menu has closed, so it doesn't take focus from what opens.
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const optionsButton = useRef<HTMLButtonElement>(null);
  return (
    <article
      className="insights-card insights-observation"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const onOptions =
          event.target instanceof Element &&
          event.target.closest(".insights-observation-options");
        // Menus and dialogs portal out, but their events still arrive here.
        if (onOptions || menuOpen || action) onPreviewEnd();
        else onPreview(item, event);
      }}
      onPointerLeave={onPreviewEnd}
    >
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
        <h3 className="font-inter text-base font-medium text-text-neutral-strong">
          {/* Stretches over the whole card in CSS, so only the options stay separate. */}
          <button
            type="button"
            className="insights-observation-open block w-full truncate text-left"
            onClick={() => onOpen(item)}
          >
            {item.title}
          </button>
        </h3>
        <p className="mt-1 truncate font-inter text-sm text-text-neutral-weak">
          {item.detail}
        </p>
      </div>
      <DropdownMenu
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (open) onPreviewEnd();
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            ref={optionsButton}
            variant="ghost"
            size="icon"
            className="insights-observation-options -mt-1 shrink-0 rounded-full"
            aria-label={`Options for ${item.title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
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
            <DropdownMenuItem onSelect={() => onOpen(item)}>
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
  onOpen,
  onChanged,
}: {
  items: ObservationItem[];
  empty: ReactNode;
  onOpen: (item: ObservationItem) => void;
  onChanged: () => Promise<unknown>;
}) {
  const preview = useSourcesPreview();
  if (!items.length) return empty;
  return (
    <div className="insights-list">
      {items.map((item) => (
        <ObservationCard
          key={item.id}
          item={item}
          onOpen={onOpen}
          onPreview={preview.show}
          onPreviewEnd={preview.hide}
          onChanged={onChanged}
        />
      ))}
      <ObservationSourcesPreview preview={preview} />
    </div>
  );
}
