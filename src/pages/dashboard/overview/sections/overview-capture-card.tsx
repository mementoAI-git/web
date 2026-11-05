import { reportFetcherError } from "@/api/report-fetcher-error";
import "../overview-motion.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoaderIcon, Pause, Play, Plus } from "lucide-react";
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
import { useOverviewDictation } from "./use-overview-dictation";
import cancelLight from "@/assets/icon/overview-recording/cancel-light.svg";
import cancelDark from "@/assets/icon/overview-recording/cancel-dark.svg";
import stopLight from "@/assets/icon/overview-recording/stop-light.svg";
import stopDark from "@/assets/icon/overview-recording/stop-dark.svg";
import microphoneLight from "@/assets/icon/overview-recording/microphone-light.svg";
import microphoneDark from "@/assets/icon/overview-recording/microphone-dark.svg";
import dotLight from "@/assets/icon/overview-recording/dot-light.svg";
import dotDark from "@/assets/icon/overview-recording/dot-dark.svg";
import trash from "@/assets/icon/overview-recording/trash.svg";
import transcriptMicrophone from "@/assets/icon/overview-recording/microphone-transcript.svg";

function RecordingIcon({
  src,
  brand = false,
}: {
  src: string;
  brand?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block size-5 shrink-0 bg-current ${brand ? "text-icon-brand-strong" : ""}`}
      style={{
        maskImage: `url("${src}")`,
        maskSize: "20px 20px",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
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

  const recording = useOverviewDictation((addition) => {
    const next = addition.trim();
    if (!next) return;
    updateText((previous) =>
      previous.trim()
        ? `${previous}${/\s$/.test(previous) ? "" : " "}${next}`
        : next,
    );
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
    toast.error(recording.error, {
      id: recordingToastId,
      ...(recording.canRetry
        ? {
            duration: Infinity,
            action: { label: "Retry", onClick: () => void recording.retry() },
            cancel: { label: "Discard", onClick: recording.cancel },
            onDismiss: recording.cancel,
          }
        : {}),
    });
  }, [recording, recordingToastId]);
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
    if (savingRef.current || saving || !textRef.current.trim()) return;
    savingRef.current = true;
    const submitted = textRef.current;
    try {
      const result = await saveThought({
        body: storyBodyFromText(submitted),
        visibility: "private",
      });
      if (!result?.success) {
        toast.error(
          result?.message || "Couldn’t save your thoughts. Try again.",
        );
        return;
      }
      if (textRef.current === submitted) updateText("");
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
  const isTranscribing = recording.phase === "transcribing";
  const hasText = Boolean(text.trim());
  const showRecording =
    isStarting || isRecording || (isTranscribing && !hasText);
  const busy =
    recording.phase === "starting" || recording.phase === "transcribing";
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
  }, [text, showRecording, isTranscribing]);
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
  }, [text, showRecording, isTranscribing, recording.phase]);
  const canEdit = !showRecording && !busy && !saving;
  const cardState = showRecording
    ? recording.phase
    : isTranscribing
      ? "transcribing"
      : hasText
        ? "draft"
        : "default";
  const recordingLabel = isRecording
    ? recording.phase === "paused"
      ? "Paused…"
      : "Recording…"
    : recording.phase === "starting"
      ? "Preparing microphone…"
      : "Transcribing…";
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
        className={`overview-capture-card overview-motion sky-card relative isolate flex min-h-[178px] flex-col justify-between overflow-hidden rounded-3xl border border-stroke-neutral-weaker bg-bg-neutral ${hasText ? "p-[23px]" : "p-6"} gap-0`}
        data-testid="overview-capture-card"
      >
        <div
          data-testid="capture-writing-area"
          className={`relative flex-1 ${canEdit ? "cursor-text" : ""} ${hasText && !showRecording ? "pb-[45px]" : "pb-8"}`}
        >
          {isTranscribing && hasText ? (
            <div
              role="textbox"
              aria-label="Your thoughts"
              aria-readonly="true"
              className="relative max-h-[306px] min-h-[34px] w-full overflow-y-auto whitespace-pre-wrap break-words font-garamond text-[24px] leading-[34px] text-text-neutral-strong"
            >
              <span>{text.trimEnd()}</span>
              <LoaderIcon
                role="status"
                aria-label="Transcribing additional recording"
                className="ml-2 inline-block size-4 animate-spin align-middle text-icon-neutral-weak"
              />
            </div>
          ) : (
            (hasText || !showRecording) &&
            !isTranscribing && (
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
            )
          )}
          {showRecording ? (
            <div
              className={`t-panel-slide flex flex-wrap items-center ${isTranscribing ? "gap-2" : "gap-4"}`}
              data-open="true"
              role="status"
              aria-label={isTranscribing ? "Transcribing" : undefined}
            >
              {isTranscribing && (
                <LoaderIcon
                  aria-hidden
                  className="size-4 animate-spin text-icon-neutral-weak"
                />
              )}
              <span className="font-garamond text-2xl italic leading-[34px] text-text-neutral-strong">
                <span
                  className={
                    isTranscribing || isStarting ? "t-shimmer" : undefined
                  }
                  data-text={recordingLabel}
                >
                  {recordingLabel}
                </span>
              </span>
              {isRecording && (
                <span className="flex items-center gap-2 font-geist text-sm tabular-nums text-text-neutral-weak">
                  <img src={dark ? dotDark : dotLight} alt="" />
                  {String(Math.floor(recording.seconds / 60)).padStart(2, "0")}:
                  {String(recording.seconds % 60).padStart(2, "0")}s
                </span>
              )}
            </div>
          ) : null}
        </div>
        {showRecording ? (
          <div
            key="recording-controls"
            data-capture-actions
            data-open="true"
            className="t-panel-slide flex h-10 items-center"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="Cancel recording"
              onClick={recording.cancel}
              className={roundButton}
            >
              <RecordingIcon src={dark ? cancelDark : cancelLight} />
            </Button>
            <div
              className="flex h-10 min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden px-3"
              aria-hidden
            >
              {recording.levels.map((height, index) => (
                <span
                  key={index}
                  className="w-1 shrink-0 rounded-lg bg-icon-neutral-weak"
                  style={{ height: isStarting ? 5 : height }}
                />
              ))}
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="icon"
                aria-label="Stop recording and transcribe"
                disabled={isStarting || isTranscribing}
                onClick={recording.stop}
                className={roundButton}
              >
                <RecordingIcon src={dark ? stopDark : stopLight} brand />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={
                  recording.phase === "paused"
                    ? "Resume recording"
                    : "Pause recording"
                }
                aria-pressed={recording.phase === "paused"}
                disabled={isStarting || isTranscribing}
                onClick={recording.togglePause}
                className={roundButton}
              >
                {recording.phase === "paused" ? (
                  <Play aria-hidden className="size-5" />
                ) : (
                  <Pause aria-hidden className="size-5" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={hasText ? "draft-controls" : "default-controls"}
            data-capture-actions
            data-open="true"
            className="t-panel-slide relative flex flex-wrap items-start justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              {hasText ? (
                <>
                  <Button
                    key="save-transcript"
                    type="button"
                    size="lg"
                    disabled={busy || saving}
                    onClick={() => void saveNow()}
                    className="rounded-[64px]"
                  >
                    {saving ? "Saving…" : "Save now"}
                  </Button>
                  <Button
                    key="use-as-story"
                    variant="outline"
                    size="lg"
                    disabled={busy || saving}
                    onClick={() =>
                      open?.("create-memory", {
                        payload: { body: storyBodyFromText(text) },
                      })
                    }
                    className="rounded-[64px] border-stroke-neutral-weak bg-black/[0.04] text-text-neutral-strong shadow-none hover:bg-black/[0.06] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                  >
                    Use as story
                  </Button>
                  <Button
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
                  </Button>
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
                disabled={busy || saving || recording.canRetry}
                variant="outline"
                size="icon"
                aria-label={hasText ? "Record more" : "Record your thoughts"}
                onClick={() => void recording.start()}
                className={
                  hasText
                    ? "size-[42px] shrink-0 rounded-full border-stroke-neutral-strong bg-transparent p-[10px] text-icon-neutral-weak backdrop-blur-[1px]"
                    : roundButton
                }
              >
                <RecordingIcon
                  src={
                    hasText
                      ? transcriptMicrophone
                      : dark
                        ? microphoneDark
                        : microphoneLight
                  }
                />
              </Button>
              {busy && !isTranscribing && (
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
              <AlertDialogTitle>Clear your text?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the draft from this card and this device.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep text</AlertDialogCancel>
              <AlertDialogAction onClick={() => updateText("")}>
                Clear text
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
