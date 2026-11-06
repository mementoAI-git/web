import { useDialogFocus } from "./use-dialog-focus";
import { useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { BookOpen, Images, Mic, PenLine, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AudioAttachmentRecorder } from "@/components/recorder/voice-recorder";
import { displayFileName } from "@/utility/file-label";
import useFileUpload from "@/hooks/use-file-upload";
import { useStore } from "@/hooks/use-store";
import {
  addContribution,
  getSources,
  shareSource,
  type Person,
  type SharedItem,
} from "@/api/people";

type Step = "menu" | "write" | "media" | "record" | "share";
const actions = [
  {
    step: "record",
    label: "Record audio",
    description: "Keep a voice or a moment.",
    Icon: Mic,
  },
  {
    step: "write",
    label: "Write a note",
    description: "A memory from your perspective.",
    Icon: PenLine,
  },
  {
    step: "media",
    label: "Upload media",
    description: "Give a moment a place to live.",
    Icon: Images,
  },
  {
    step: "share",
    label: "Choose a memory",
    description: "Share an existing memory without making a copy.",
    Icon: BookOpen,
  },
] as const;
export function ContributionDialog({
  person,
  onClose,
  onSaved,
}: {
  person: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const [step, setStep] = useState<Step>("menu");
  const [kind, setKind] = useState<SharedItem["source_type"]>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const { files, handleUpload, handleDeleteFile, retryUpload, setFiles } =
    useFileUpload({ retainFailures: true });
  const {
    data: library,
    error: libraryError,
    isLoading,
    mutate,
  } = useSWR(
    step === "share" ? ["people-sources", user?._id, page, search] : null,
    () => getSources(page, search),
    { shouldRetryOnError: false },
  );
  const retry = useRequestRecovery(
    `contribution:${person.user_id}:${page}:${search}`,
    step === "share" ? libraryError : null,
    mutate,
    "Couldn’t load your memories. Try again.",
  );
  const uploading = files.some(
    (file) => !file.uploadedFile && !file.uploadFailed,
  );
  const incomplete = files.some((file) => !file.uploadedFile);
  const ready =
    Boolean(title.trim()) &&
    !incomplete &&
    (step === "write"
      ? Boolean(body.trim())
      : step === "media" && files.length > 0);
  const removeFile = async (file: (typeof files)[number]) => {
    if (busyRef.current) return;
    if (!file.uploadedFile) {
      setFiles((current) => current.filter((entry) => entry.id !== file.id));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await handleDeleteFile(file);
    } catch {
      toast.error("Couldn’t remove this attachment. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const upload = async (file: File, duration?: number) => {
    if (
      !file.type.startsWith("audio/") &&
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      toast.error("Choose a photo, video or audio recording.");
      return;
    }
    if (file.type.startsWith("audio/")) setKind("voice");
    else if (file.type.startsWith("video/")) setKind("video");
    else setKind("photo");
    await handleUpload({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      duration,
    });
  };
  const submit = async (sourceId?: string) => {
    if (
      busyRef.current ||
      saved ||
      (sourceId
        ? libraryError ||
          !library?.items.some((item) => item.source_id === sourceId)
        : !ready)
    )
      return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (sourceId) await shareSource(person.user_id, sourceId);
      else
        await addContribution(person.user_id, {
          title: title.trim(),
          body,
          kind,
          attachments: files.flatMap((file) =>
            file.uploadedFile ? [String(file.uploadedFile._id)] : [],
          ),
        });
      setSaved(true);
      onSaved();
    } catch {
      toast.error(
        "Couldn’t add this memory. Check your connection and try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busyRef.current && !uploading) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={restoreFocus}
        className="people-dialog max-h-[85dvh] overflow-y-auto bg-bg-neutral sm:max-w-xl"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
        onEscapeKeyDown={(event) => {
          if (busyRef.current || uploading) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busyRef.current || uploading) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-garamond text-2xl text-text-neutral-strong">
            {saved
              ? "Added to Our Space"
              : step === "menu"
                ? "Add memory"
                : step === "media" && kind === "voice"
                  ? "Your recording"
                  : actions.find((action) => action.step === step)?.label}
          </DialogTitle>
          <DialogDescription className="text-text-neutral-weak">
            {saved
              ? `Your memory is now shared with ${person.name}.`
              : `Share with ${person.name}.`}
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <Button size="form" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            {step !== "menu" && (
              <Button
                size="form"
                variant="ghost"
                className="people-control w-fit"
                disabled={busy || uploading}
                onClick={() => setStep("menu")}
              >
                <ArrowLeft aria-hidden />
                All actions
              </Button>
            )}
            {step === "menu" && (
              <div className="divide-y divide-stroke-neutral-weak">
                {actions.map(({ step: next, label, Icon }) => (
                  <Button
                    size="form"
                    key={next}
                    variant="ghost"
                    className="people-control h-auto w-full justify-start gap-4 rounded-xl px-3 py-4 text-left whitespace-normal"
                    onClick={() => {
                      setKind(next === "write" ? "note" : "photo");
                      setStep(next);
                    }}
                  >
                    <Icon
                      className="size-5 text-icon-neutral-weak"
                      aria-hidden
                    />
                    <span>
                      <span className="block text-sm text-text-neutral-strong">
                        {label}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            )}
            {step === "record" && (
              <AudioAttachmentRecorder
                onClose={() =>
                  setStep((current) => (current === "record" ? "menu" : current))
                }
                onFinish={(file, duration) => {
                  setKind("voice");
                  setStep("media");
                  setTitle(title || "Voice memory");
                  void upload(file, duration);
                }}
              />
            )}
            {(step === "write" || step === "media") && (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="people-contribution-title">Title</Label>
                  <Input
                    variant="form"
                    id="people-contribution-title"
                    disabled={busy}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={300}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="people-contribution-body">Your memory</Label>
                  <Textarea
                    id="people-contribution-body"
                    disabled={busy}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={50000}
                    placeholder="I remember…"
                    className="min-h-32 rounded-lg"
                    required={step === "write"}
                  />
                </div>
                {step === "media" && (
                  <div className="space-y-3">
                    <Label htmlFor="people-contribution-files">
                      Photos, video or audio
                    </Label>
                    <Input
                      variant="form"
                      id="people-contribution-files"
                      type="file"
                      accept="image/*,video/*,audio/*"
                      multiple
                      disabled={busy || uploading}
                      onChange={(event) => {
                        for (const file of Array.from(event.target.files || []))
                          void upload(file);
                        event.target.value = "";
                      }}
                    />
                    <ul className="space-y-2">
                      {files.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center justify-between gap-3 text-sm text-text-neutral-weak"
                        >
                          <span className="min-w-0 truncate">
                            {displayFileName(file.file?.name)}{" "}
                            {file.uploadedFile
                              ? ""
                              : file.uploadFailed
                                ? ""
                                : `· uploading ${file.progress}%`}
                          </span>
                          {file.uploadFailed && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => void retryUpload(file)}
                            >
                              Retry upload
                            </Button>
                          )}
                          {(file.uploadedFile || file.uploadFailed) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              type="button"
                              onClick={() => void removeFile(file)}
                            >
                              Remove
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs leading-5 text-text-neutral-weak">
                  Shared with {person.name}, credited to you.
                </p>
                <Button
                  size="form"
                  type="submit"
                  className="people-control"
                  disabled={busy || !ready}
                >
                  {busy ? "Adding…" : "Add to Our Space"}
                </Button>
              </form>
            )}
            {step === "share" && (
              <div className="space-y-4">
                <Input
                  variant="form"
                  aria-label="Search your memories"
                  placeholder="Search your memories"
                  disabled={busy}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                {isLoading ? (
                  <p role="status">Loading your memories…</p>
                ) : libraryError ? (
                  <Button size="form" variant="outline" onClick={retry}>
                    Retry loading memories
                  </Button>
                ) : !library?.items.length ? (
                  <p className="text-sm text-text-neutral-weak">
                    {search.trim()
                      ? "No memories match your search."
                      : "No saved memories yet."}
                  </p>
                ) : (
                  <ul className="divide-y divide-stroke-neutral-weak">
                    {library.items.map((item) => (
                      <li
                        key={item.source_id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <span className="min-w-0 truncate text-sm text-text-neutral-strong">
                          {item.title}
                        </span>
                        <Button
                          size="form"
                          variant="outline"
                          className="people-control"
                          aria-label={`Share ${item.title}`}
                          disabled={busy}
                          onClick={() => void submit(item.source_id)}
                        >
                          {busy ? "Sharing…" : "Share"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {library && (page > 1 || library.has_next_page) && (
                  <div className="flex justify-between">
                    <Button
                      size="form"
                      variant="ghost"
                      disabled={busy || page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="form"
                      variant="ghost"
                      disabled={busy || !library.has_next_page}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
