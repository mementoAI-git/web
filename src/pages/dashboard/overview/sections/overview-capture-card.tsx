import { reportFetcherError } from "@/api/report-fetcher-error";
import "../overview-motion.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import { postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { OverviewDesignIcon } from "@/components/overview-design-icon";
import { useTheme } from "@/contexts/theme";
import { useModal } from "@/hooks/use-modal";
import useFileUpload from "@/hooks/use-file-upload";
import { useVoiceCapture } from "@/hooks/use-voice-capture";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { QuickCaptureMediaStack } from "@/components/modal/memory/quick-capture/media-stack";
import type { IFile, IOnUploadPayload } from "@/utility/interface";
import {
  VoiceRecorderControls,
  VoiceRecorderIcon as RecordingIcon,
  VoiceRecorderSilenceHint,
  VoiceRecorderStatus,
} from "@/components/recorder/voice-recorder";
import microphoneLight from "@/assets/icon/overview-recording/microphone-light.svg";
import microphoneDark from "@/assets/icon/overview-recording/microphone-dark.svg";
import trash from "@/assets/icon/overview-recording/trash.svg";
import transcriptMicrophone from "@/assets/icon/overview-recording/microphone-transcript.svg";

const MAX_VOICE_BYTES = 15 * 1024 * 1024;

type SavedVoiceNote = { file: IFile; durationSec?: number };

function readSavedVoiceNotes(key: string | null): IOnUploadPayload[] {
  if (!key) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "[]") as SavedVoiceNote[];
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((note) => note?.file?._id)
      .map((note) => ({
        id: note.file._id,
        file: null,
        progress: 100,
        duration: note.durationSec,
        uploadedFile: note.file,
      }));
  } catch {
    return [];
  }
}

const HANDED_OFF_EVENT = "memento:overview-draft-handed-off";

/** Lets go of a draft that now lives in a story, even if this card has since unmounted. */
function letGoOfHandedOffDraft(
  userId: string | undefined,
  text: string,
  fileIds: string[],
  outcome: "published" | "draft",
) {
  try {
    if (userId) {
      const textKey = `memento-overview-draft:${userId}`;
      if (localStorage.getItem(textKey) === text) localStorage.removeItem(textKey);
      const voiceKey = `memento-overview-voice:${userId}`;
      const kept = readSavedVoiceNotes(voiceKey)
        .filter((note) => !fileIds.includes(note.id))
        .map((note) => ({ file: note.uploadedFile, durationSec: note.duration }));
      if (kept.length) localStorage.setItem(voiceKey, JSON.stringify(kept));
      else localStorage.removeItem(voiceKey);
    }
  } catch {
    /* The live card below still clears itself. */
  }
  window.dispatchEvent(
    new CustomEvent(HANDED_OFF_EVENT, { detail: { userId, text, fileIds } }),
  );
  if (outcome === "draft") toast.success("Moved to your story drafts.");
}

function storyBodyFromText(text: string) {
  return text
    .split("\n")
    .map(
      (line) =>
        `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</p>`,
    )
    .join("");
}

export function OverviewCaptureCard({
  userId,
  onVoiceConversation,
}: {
  userId?: string;
  onVoiceConversation: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const { open } = useModal();
  const navigate = useNavigate();
  const { trigger: saveThought, isMutating: saving } = useSWRMutation(
    endpoint.memoriesQuickCapture,
    postFetcher,
  );
  const storageKey = userId ? `memento-overview-draft:${userId}` : null;
  const [text, setText] = useState(() => {
    try {
      return storageKey ? (localStorage.getItem(storageKey) ?? "") : "";
    } catch {
      return "";
    }
  });
  const textRef = useRef(text);
  const savingRef = useRef(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number>();
  const [storageError, setStorageError] = useState(false);
  function updateText(value: string | ((previous: string) => string)) {
    const next = typeof value === "function" ? value(textRef.current) : value;
    textRef.current = next;
    setText(next);
    try {
      if (storageKey) {
        if (next) localStorage.setItem(storageKey, next);
        else localStorage.removeItem(storageKey);
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  const { canUse } = useFeatureFlags();
  const { files, handleUpload, retryUpload, handleDeleteFile, setFiles } = useFileUpload({ retainFailures: true });
  const voiceStorageKey = userId ? `memento-overview-voice:${userId}` : null;
  const voiceRestored = useRef(false);
  useEffect(() => {
    const saved = readSavedVoiceNotes(voiceStorageKey);
    if (saved.length) setFiles(saved);
    voiceRestored.current = true;
    // The card remounts per user, so this only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!voiceStorageKey || !voiceRestored.current) return;
    const uploaded: SavedVoiceNote[] = files.flatMap((file) =>
      file.uploadedFile
        ? [{ file: file.uploadedFile, durationSec: file.duration }]
        : [],
    );
    try {
      if (uploaded.length)
        localStorage.setItem(voiceStorageKey, JSON.stringify(uploaded));
      else localStorage.removeItem(voiceStorageKey);
    } catch {
      setStorageError(true);
    }
  }, [files, voiceStorageKey]);
  useEffect(() => {
    const onHandedOff = (event: Event) => {
      const detail = (event as CustomEvent<{
        userId?: string;
        text: string;
        fileIds: string[];
      }>).detail;
      if (detail.userId !== userId) return;
      if (textRef.current === detail.text) updateText("");
      setFiles((current) =>
        current.filter((file) => !file.uploadedFile || !detail.fileIds.includes(file.uploadedFile._id)),
      );
    };
    window.addEventListener(HANDED_OFF_EVENT, onHandedOff);
    return () => window.removeEventListener(HANDED_OFF_EVENT, onHandedOff);
    // updateText only touches refs and this user's keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFiles, userId]);
  const voiceNoteIds = Object.fromEntries(
    files.map((file) => [file.id, true as const]),
  );
  const attachmentIds = files.flatMap((file) =>
    file.uploadedFile ? [file.uploadedFile._id] : [],
  );
  const uploadsPending = files.some((file) => file.progress !== 100);
  const recording = useVoiceCapture({
    mode: "audio",
    onAudio: (file, duration) => {
      if (!canUse("attachments.audio_upload")) {
        toast.error("Audio uploads are currently disabled.");
        return;
      }
      if (file.size > MAX_VOICE_BYTES) {
        toast.error("That recording is too large. The limit is 15MB.");
        return;
      }
      void handleUpload({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        duration,
      });
    },
  });
  const reportedRecordingError = useRef("");
  const recordingToastId = `overview-recording-error:${userId ?? "guest"}`;
  useEffect(() => {
    if (!recording.error) {
      reportedRecordingError.current = "";
      return;
    }
    if (reportedRecordingError.current === recording.error) return;
    reportedRecordingError.current = recording.error;
    toast.error(recording.error, { id: recordingToastId });
  }, [recording.error, recordingToastId]);
  useEffect(() => {
    if (storageError)
      toast.error(
        "Draft couldn’t be saved on this device. Keep this page open.",
        { id: "overview-draft-storage-error" },
      );
  }, [storageError]);
  useEffect(
    () => () => {
      toast.dismiss(recordingToastId);
    },
    [recordingToastId],
  );
  async function saveNow() {
    const submittedAttachments = attachmentIds;
    if (
      savingRef.current ||
      saving ||
      uploadsPending ||
      (!textRef.current.trim() && !submittedAttachments.length)
    )
      return;
    savingRef.current = true;
    const submitted = textRef.current;
    try {
      const result = await saveThought({
        ...(submitted.trim() ? { body: storyBodyFromText(submitted) } : {}),
        ...(submittedAttachments.length
          ? { attachments: submittedAttachments }
          : {}),
        visibility: "private",
      });
      if (!result?.success) {
        toast.error(
          result?.message || "Couldn’t save your thoughts. Try again.",
        );
        return;
      }
      if (textRef.current === submitted) updateText("");
      setFiles((current) =>
        current.filter(
          (file) =>
            !file.uploadedFile ||
            !submittedAttachments.includes(file.uploadedFile._id),
        ),
      );
      toast.success(
        "Quick note saved. Details will finish processing in the background.",
      );
      void mutate(
        (key) => typeof key === "string" && key.startsWith(endpoint.stories),
      ).catch(() => undefined);
      void mutate(endpoint.userStats).catch(() => undefined);
    } catch (error) {
      reportFetcherError(error, "Couldn’t save your thoughts. Try again.");
    } finally {
      savingRef.current = false;
    }
  }
  const isRecording =
    recording.phase === "recording" || recording.phase === "paused";
  const isStarting = recording.phase === "starting";
  const isSavingRecording = recording.phase === "saving";
  const hasText = Boolean(text.trim());
  const hasDraft = hasText || files.length > 0;
  const showRecording = isStarting || isRecording || isSavingRecording;
  const busy = isStarting || isSavingRecording;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = textareaRef.current;
    if (!input) return;
    const resize = () => {
      input.style.height = "0px";
      const contentHeight = input.scrollHeight;
      input.style.height = `${Math.min(9 * 34, Math.max(34, contentHeight))}px`;
      input.style.overflowY = contentHeight > 9 * 34 ? "auto" : "hidden";
    };
    resize();
    if (typeof ResizeObserver === "undefined") return;
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) {
        width = input.clientWidth;
        resize();
      }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [text, showRecording]);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const height = card.getBoundingClientRect().height;
      if (height) setCardHeight(height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [text, showRecording, files.length, recording.phase]);
  const canEdit = !showRecording && !busy && !saving;
  const cardState = showRecording
    ? recording.phase
    : hasDraft
      ? "draft"
      : "default";
  const dark = resolvedTheme === "dark";
  const roundButton =
    "size-10 shrink-0 rounded-full border-stroke-neutral-strong bg-transparent p-[9px] text-icon-neutral-weak";
  return (
    <div
      className="overview-capture-resize t-resize"
      style={{ height: cardHeight }}
    >
      <div
        ref={cardRef}
        onClick={(event) => {
          if (
            !canEdit ||
            (event.target as HTMLElement).closest(
              "textarea, [data-capture-actions], [role=alertdialog]",
            )
          )
            return;
          textareaRef.current?.focus();
        }}
        data-state={cardState}
        className={`overview-capture-card overview-motion sky-card relative isolate flex min-h-[178px] flex-col justify-between overflow-hidden rounded-3xl border border-stroke-neutral-weaker bg-bg-neutral ${hasDraft ? "p-[23px]" : "p-6"} gap-0`}
        data-testid="overview-capture-card"
      >
        <div
          data-testid="capture-writing-area"
          className={`relative flex-1 ${canEdit ? "cursor-text" : ""} ${hasDraft && !showRecording ? "pb-[45px]" : "pb-8"}`}
        >
          {(hasText || !showRecording) && (
              <textarea
                ref={textareaRef}
                aria-label="Your thoughts"
                placeholder={editorFocused ? "" : "What’s on your mind today?"}
                onFocus={() => setEditorFocused(true)}
                onBlur={() => setEditorFocused(false)}
                value={text}
                onChange={(event) => updateText(event.target.value)}
                rows={1}
                readOnly={showRecording || busy || saving}
                className="relative min-h-[34px] w-full resize-none bg-transparent font-garamond text-[24px] leading-[34px] text-text-neutral-strong outline-none placeholder:text-text-neutral-strong"
              />
          )}
          {showRecording ? (
            <VoiceRecorderStatus
              phase={recording.phase}
              seconds={recording.seconds}
              className="t-panel-slide"
              data-open="true"
            />
          ) : null}
          {isRecording ? <VoiceRecorderSilenceHint silent={recording.silent} /> : null}
        </div>
        {files.length > 0 && (
          <div data-capture-actions className="pb-4">
            <QuickCaptureMediaStack
              files={files}
              voiceNoteIds={voiceNoteIds}
              onRetry={retryUpload}
              onRemove={(id) => {
                const file = files.find((item) => item.id === id);
                if (file?.uploadedFile) void handleDeleteFile(file).catch(() => undefined);
                else setFiles((current) => current.filter((item) => item.id !== id));
              }}
            />
          </div>
        )}
        {showRecording ? (
          <VoiceRecorderControls
            key="recording-controls"
            data-capture-actions
            data-open="true"
            className="t-panel-slide"
            phase={recording.phase}
            levels={recording.levels}
            onCancel={recording.cancel}
            onStop={recording.stop}
            onTogglePause={recording.togglePause}
          />
        ) : (
          <div
            key={hasDraft ? "draft-controls" : "default-controls"}
            data-capture-actions
            data-open="true"
            className="t-panel-slide relative flex flex-wrap items-start justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              {hasDraft ? (
                <>
                  <Button
                    key="save-transcript"
                    type="button"
                    size="lg"
                    disabled={busy || saving || uploadsPending}
                    onClick={() => void saveNow()}
                    className="rounded-[64px]"
                  >
                    {saving ? "Saving…" : "Save now"}
                  </Button>
                  <Button
                    key="use-as-story"
                    variant="outline"
                    size="lg"
                    disabled={busy || saving || uploadsPending}
                    onClick={() =>
                      open?.("create-memory", {
                        payload: hasText ? { body: storyBodyFromText(text) } : {},
                        onHandedOff: (outcome: "published" | "draft") =>
                          letGoOfHandedOffDraft(userId, text, attachmentIds, outcome),
                        ...(files.length
                          ? {
                              attachments: files.flatMap((file) =>
                                file.uploadedFile
                                  ? [
                                      {
                                        file: file.uploadedFile,
                                        duration: file.duration,
                                      },
                                    ]
                                  : [],
                              ),
                            }
                          : {}),
                      })
                    }
                    className="rounded-[64px] border-stroke-neutral-weak bg-black/[0.04] text-text-neutral-strong shadow-none hover:bg-black/[0.06] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                  >
                    Use as story
                  </Button>
                  {hasText && <Button
                    key="discuss-transcript"
                    variant="ghost"
                    size="lg"
                    disabled={busy || saving}
                    onClick={() =>
                      navigate("/chat", { state: { overviewDiscussion: text } })
                    }
                    className="rounded-[64px] bg-transparent text-text-neutral-weak shadow-none hover:bg-fill-neutral-weak hover:text-text-neutral-strong dark:hover:bg-fill-neutral-weak"
                  >
                    Discuss
                  </Button>}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Clear text"
                    disabled={busy || saving}
                    onClick={() => setClearOpen(true)}
                    className="size-10 rounded-full border-0 p-[10px] text-icon-error-strong backdrop-blur-[1px]"
                  >
                    <img
                      src={trash}
                      alt=""
                      aria-hidden
                      width={20}
                      height={20}
                      className="size-5 shrink-0"
                    />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    key="add-story"
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={() => open?.("create-memory")}
                    className="rounded-[64px]"
                  >
                    <Plus className="size-5 shrink-0" aria-hidden /> Add story
                  </Button>
                  <Button
                    key="voice-conversation"
                    disabled={busy}
                    onClick={onVoiceConversation}
                    className="h-10 gap-2 rounded-[64px] bg-fill-overview-voice px-4 font-geist text-sm font-semibold text-overview-voice [background-image:none] hover:bg-fill-overview-voice/90"
                  >
                    <OverviewDesignIcon name="phone" /> Talk
                  </Button>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                disabled={busy || saving}
                variant="outline"
                size="icon"
                aria-label={hasDraft ? "Record more" : "Record your thoughts"}
                onClick={() => void recording.start()}
                className={
                  hasDraft
                    ? "size-[42px] shrink-0 rounded-full border-stroke-neutral-strong bg-transparent p-[10px] text-icon-neutral-weak backdrop-blur-[1px]"
                    : roundButton
                }
              >
                <RecordingIcon
                  src={
                    hasDraft
                      ? transcriptMicrophone
                      : dark
                        ? microphoneDark
                        : microphoneLight
                  }
                />
              </Button>
              {busy && (
                <Button variant="ghost" onClick={recording.cancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{files.length ? "Clear this draft?" : "Clear your text?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {files.length
                  ? "This deletes your recording and removes the draft from this card and this device."
                  : "This removes the draft from this card and this device."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep text</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  updateText("");
                  files.forEach((file) => {
                    if (file.uploadedFile)
                      void handleDeleteFile(file).catch(() => undefined);
                  });
                  setFiles([]);
                }}
              >
                Clear text
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
