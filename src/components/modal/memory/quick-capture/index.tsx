"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Image as ImageIcon,
  Mic,
  Music,
  Smile,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";

import { useModal } from "@/hooks/use-modal";
import { useDismissOnOutsidePress } from "@/hooks/use-dismiss-on-outside-press";
import { useStore } from "@/hooks/use-store";
import { useInlineAudioCapture } from "@/hooks/use-inline-audio-capture";
import { useFeatureFlags } from "@/contexts/feature-flags";
import useFileUpload from "@/hooks/use-file-upload";
import endpoint from "@/api/endpoint";
import { fetcher, fileUploadFetcher, postFetcher, postJsonQuiet, postTranscribeQuiet } from "@/api/fetcher";
import { cn } from "@/utility";
import { parseSubscriptionGateError } from "@/features/pricing/subscription-errors";
import {
  SUPPORTED_FILE_TYPES,
  inferMimeType,
  isSupportedFileMime,
  uploadMimeBaseType,
} from "@/utility/constant";
import { TimesIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/spinner";
import { InlineVoiceRecorder } from "@/components/recorder/inline-voice-recorder";
import type { IBeneficiary, IFile, IOnUploadPayload } from "@/utility/interface";
import { QuickCaptureMediaStack } from "./media-stack";
import type { DailyPromptCapturePayload, QuickCaptureDraft } from "@/lib/quick-capture-drafts";
import {
  htmlFromQuickCaptureNote,
  parseQuickCaptureDraftJson,
  quickCaptureDraftPreviewLine,
  quickCaptureDraftStorageKey,
  scanQuickCaptureDraftKeys,
} from "@/lib/quick-capture-drafts";

export type { DailyPromptCapturePayload } from "@/lib/quick-capture-drafts";

type QuickCaptureModalData = {
  daily_prompt?: DailyPromptCapturePayload;
};

const OUTBOX_KEY = "quick-capture-outbox";
const QUICK_MAX_MB = 15;
const MAX_FILE_BYTES = QUICK_MAX_MB * 1024 * 1024;
const NOTE_CHAR_MAX = 8000;
const REFLECTION_DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function CharRing({ value, max }: { value: number; max: number }) {
  const pct = Math.min(1, value / max);
  const c = 2 * Math.PI * 10;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r="10" fill="none" className="stroke-fill-neutral-weaker" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r="10"
        fill="none"
        className="stroke-fill-brand-strong"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

const AUDIO_INPUT_ACCEPT = [
  ".mp3",
  ".wav",
  ".webm",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".mpeg",
  "audio/*",
].join(",");

export function QuickCapture(props: { isMobile?: boolean; data?: unknown }) {
  const { isMobile = false } = props;
  const modalData = props.data as QuickCaptureModalData | undefined;
  const dailyPrompt = modalData?.daily_prompt;
  const { close } = useModal();
  const { user } = useStore();
  const { canUse } = useFeatureFlags();
  const whoId = useId();

  const [note, setNote] = useState("");
  const [voiceNoteIds, setVoiceNoteIds] = useState<Record<string, true>>({});
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [whoOpen, setWhoOpen] = useState(false);
  const [showInlineRecorder, setShowInlineRecorder] = useState(false);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const draftsMenuRef = useRef<HTMLDivElement>(null);
  const privacyMenuRef = useRef<HTMLDivElement>(null);
  const emojiAnchorRef = useRef<HTMLDivElement>(null);
  const emojiPickerPortalRef = useRef<HTMLDivElement>(null);

  const [draftsOpen, setDraftsOpen] = useState(false);
  const [storageKeyOverride, setStorageKeyOverride] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const effectiveStorageKey = storageKeyOverride ?? quickCaptureDraftStorageKey(user?.email, dailyPrompt);

  const noteRef = useRef(note);
  const filesRef = useRef(files);
  const voiceIdsRef = useRef(voiceNoteIds);
  const beneficiariesRef = useRef(selectedBeneficiaryIds);
  const ctxRef = useRef({ email: user?.email, daily: dailyPrompt, key: effectiveStorageKey });
  useEffect(() => {
    noteRef.current = note;
    filesRef.current = files;
    voiceIdsRef.current = voiceNoteIds;
    beneficiariesRef.current = selectedBeneficiaryIds;
    ctxRef.current = { email: user?.email, daily: dailyPrompt, key: effectiveStorageKey };
  }, [note, files, voiceNoteIds, selectedBeneficiaryIds, user?.email, dailyPrompt, effectiveStorageKey]);

  const { data: beneficiariesRes } = useSWR(
    whoOpen ? `${endpoint.beneficiaries}?page=1&limit=100` : null,
    fetcher,
  );
  const beneficiaries: IBeneficiary[] = beneficiariesRes?.data?.docs ?? [];

  const { trigger: saveThought, isMutating } = useSWRMutation(endpoint.memoriesQuickCapture, postFetcher);

  const attachmentIds = files
    .filter((f): f is IOnUploadPayload & { uploadedFile: NonNullable<IOnUploadPayload["uploadedFile"]> } =>
      Boolean(f.uploadedFile?._id),
    )
    .map((f) => f.uploadedFile._id);

  const uploadsPending = files.some((f) => f.progress !== 100);
  const inlineRecorder = useInlineAudioCapture({
    onRecordingReady: async (file, durationSec) => {
      const up = await fileUploadFetcher(endpoint.upload, { arg: { file } });
      if (!up.success || !up.data) {
        throw new Error("Upload failed");
      }
      const raw = Array.isArray(up.data) ? up.data[0] : up.data;
      const row = raw as {
        _id?: string;
        id?: string;
        url?: string;
        backup_url?: string;
        name?: string;
        size?: string | number;
      };
      const fid = row?._id ?? row?.id;
      if (!fid) {
        throw new Error("Upload failed");
      }

      const nid = uuidv4();
      const uploaded: IFile = {
        _id: String(fid),
        url:
          typeof row.url === "string" && row.url ?
            row.url
          : typeof row.backup_url === "string" ?
            row.backup_url
          : "",
        name: typeof row.name === "string" ? row.name : file.name,
        size: row.size ?? file.size,
        type: file.type,
      };

      setVoiceNoteIds((v) => ({ ...v, [nid]: true }));
      setFiles((prev) => [
        ...prev,
        {
          id: nid,
          file,
          progress: 100,
          uploadedFile: uploaded,
          duration: durationSec,
        },
      ]);

      void postTranscribeQuiet(uploaded._id);
      setShowInlineRecorder(false);
    },
    fileNamePrefix: "quick-voice",
    startDelayMs: 300,
  });
  const recordingUi = inlineRecorder.recording || inlineRecorder.busy;

  const persistToKey = useCallback(
    (key: string) => {
      const payload: QuickCaptureDraft = {
        note,
        selectedBeneficiaryIds,
        ...(dailyPrompt ? { daily_prompt: dailyPrompt } : {}),
        attachments: files
          .filter((f) => f.uploadedFile?._id)
          .map((f) => ({
            clientId: f.id,
            _id: f.uploadedFile!._id,
            url: f.uploadedFile!.url,
            name: f.uploadedFile!.name,
            type: f.uploadedFile!.type,
            kind: voiceNoteIds[f.id] ? ("voice" as const) : ("file" as const),
            durationSec: typeof f.duration === "number" ? f.duration : undefined,
          })),
      };
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    },
    [note, selectedBeneficiaryIds, dailyPrompt, files, voiceNoteIds],
  );

  const persistDraft = useCallback(() => persistToKey(effectiveStorageKey), [persistToKey, effectiveStorageKey]);

  const applyDraft = useCallback(
    (d: QuickCaptureDraft) => {
      setNote(typeof d.note === "string" ? d.note : "");
      setSelectedBeneficiaryIds(Array.isArray(d.selectedBeneficiaryIds) ? d.selectedBeneficiaryIds : []);
      const vm: Record<string, true> = {};
      const restored: IOnUploadPayload[] = (d.attachments || []).map((a) => {
        if (a.kind === "voice") vm[a.clientId] = true;
        return {
          id: a.clientId,
          file: null,
          progress: 100,
          duration: a.durationSec,
          uploadedFile: {
            _id: a._id,
            url: typeof a.url === "string" ? a.url : "",
            name: typeof a.name === "string" ? a.name : "",
            size: 0,
            type: typeof a.type === "string" ? a.type : "",
          },
        };
      });
      setVoiceNoteIds(vm);
      setFiles(restored);
    },
    [setFiles],
  );

  useEffect(() => {
    setStorageKeyOverride(null);
  }, [user?.email, dailyPrompt?.prompt_id, dailyPrompt?.pinned_text, dailyPrompt?.reflection_day_key, dailyPrompt?.prompt_type]);

  useDismissOnOutsidePress({
    active: draftsOpen,
    onDismiss: () => setDraftsOpen(false),
    rootRefs: [draftsMenuRef],
  });
  useDismissOnOutsidePress({
    active: whoOpen,
    onDismiss: () => setWhoOpen(false),
    rootRefs: [privacyMenuRef],
  });
  useDismissOnOutsidePress({
    active: showEmoji,
    onDismiss: () => setShowEmoji(false),
    rootRefs: [emojiAnchorRef, emojiPickerPortalRef],
  });

  useEffect(() => {
    if (!draftsOpen && !whoOpen && !showEmoji) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (draftsOpen) setDraftsOpen(false);
      if (whoOpen) setWhoOpen(false);
      if (showEmoji) setShowEmoji(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [draftsOpen, whoOpen, showEmoji]);

  useEffect(() => {
    return () => {
      const { daily, key } = ctxRef.current;
      const n = noteRef.current.trim();
      const f = filesRef.current;
      const hasContent = n.length > 0 || f.some((x) => x.uploadedFile || (x.progress ?? 100) < 100);
      try {
        if (hasContent) {
          const payload: QuickCaptureDraft = {
            note: noteRef.current,
            selectedBeneficiaryIds: beneficiariesRef.current,
            ...(daily ? { daily_prompt: daily as DailyPromptCapturePayload } : {}),
            attachments: f
              .filter((x) => x.uploadedFile?._id)
              .map((x) => ({
                clientId: x.id,
                _id: x.uploadedFile!._id,
                url: x.uploadedFile!.url,
                name: x.uploadedFile!.name,
                type: x.uploadedFile!.type,
                kind: voiceIdsRef.current[x.id] ? ("voice" as const) : ("file" as const),
                durationSec: typeof x.duration === "number" ? x.duration : undefined,
              })),
          };
          localStorage.setItem(key, JSON.stringify(payload));
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = typeof window !== "undefined" ? Math.min(window.innerHeight * 0.35, 280) : 280;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [note, isMobile, recordingUi]);

  useEffect(() => {
    const onUnload = () => persistDraft();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      persistDraft();
    };
  }, [persistDraft]);

  const queueFileUpload = useCallback(
    (file: File) => {
      setAttachError(null);
      if (!canUse("attachments.doc_upload")) {
        setAttachError("File uploads are currently disabled.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setAttachError(`File is too large. Max size is ${QUICK_MAX_MB}MB.`);
        return;
      }
      const resolvedType = file.type || inferMimeType(file.name);
      if (!isSupportedFileMime(resolvedType, SUPPORTED_FILE_TYPES)) {
        setAttachError("That file type isn't supported.");
        return;
      }
      if (uploadMimeBaseType(resolvedType).startsWith("image/") && !canUse("attachments.image_upload")) {
        setAttachError("Image uploads are currently disabled.");
        return;
      }
      if (uploadMimeBaseType(resolvedType).startsWith("video/") && !canUse("attachments.video_upload")) {
        setAttachError("Video uploads are currently disabled.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpload({
          id: uuidv4(),
          file,
          base64: reader.result as string,
          progress: 0,
        });
      };
      reader.readAsDataURL(file);
    },
    [canUse, handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      selected.forEach(queueFileUpload);
      e.target.value = "";
    },
    [queueFileUpload],
  );

  const handleRemoveFile = useCallback(
    async (fileId: string) => {
      const f = files.find((x) => x.id === fileId);
      if (!f) return;
      try {
        if (f.uploadedFile) await handleDeleteFile(f);
        else setFiles((prev) => prev.filter((x) => x.id !== fileId));
        setVoiceNoteIds((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      } catch {
        toast.error("Could not remove the attachment.");
      }
    },
    [files, handleDeleteFile, setFiles],
  );

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setNote((n) => (n.length >= NOTE_CHAR_MAX ? n : n + emoji));
      setShowEmoji(false);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setNote((n) => {
      if (n.length >= NOTE_CHAR_MAX) return n;
      const next = n.slice(0, start) + emoji + n.slice(end);
      return next.slice(0, NOTE_CHAR_MAX);
    });
    setShowEmoji(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const bodyHtml = htmlFromQuickCaptureNote(note);
  const canSave =
    (bodyHtml.length > 0 || attachmentIds.length > 0) &&
    !uploadsPending &&
    !inlineRecorder.recording &&
    !inlineRecorder.busy;

  const flushOutbox = useCallback(async () => {
    if (!navigator.onLine) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(OUTBOX_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    let queue: unknown[] = [];
    try {
      queue = JSON.parse(raw) as unknown[];
    } catch {
      localStorage.removeItem(OUTBOX_KEY);
      return;
    }
    const next: unknown[] = [];
    for (const item of queue) {
      const entry = item as {
        body?: string;
        attachments?: string[];
        beneficiaries?: string[];
        transcript_uncertain?: boolean;
        prompt_type?: string;
        prompt_id?: string;
        prompt_text?: string;
        reflection_day_key?: string;
      };
      const ok = await postJsonQuiet(endpoint.memoriesQuickCapture, {
        body: entry.body,
        attachments: entry.attachments,
        beneficiaries: entry.beneficiaries,
        transcript_uncertain: entry.transcript_uncertain,
        prompt_type: entry.prompt_type,
        prompt_id: entry.prompt_id,
        prompt_text: entry.prompt_text,
        reflection_day_key: entry.reflection_day_key,
      });
      if (!ok) next.push(item);
    }
    try {
      if (next.length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(next));
      else localStorage.removeItem(OUTBOX_KEY);
      if (queue.length > next.length) {
        mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories));
        mutate((key) => typeof key === "string" && key.split("?")[0] === endpoint.prompts);
        mutate(endpoint.userStats);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    flushOutbox();
    window.addEventListener("online", flushOutbox);
    return () => window.removeEventListener("online", flushOutbox);
  }, [flushOutbox]);

  const reflectionExtra =
    dailyPrompt != null && REFLECTION_DAY_KEY_RE.test(dailyPrompt.reflection_day_key)
      ? dailyPrompt.prompt_type === "static"
        ? dailyPrompt.prompt_id
          ? {
              prompt_type: "static" as const,
              prompt_id: dailyPrompt.prompt_id,
              reflection_day_key: dailyPrompt.reflection_day_key,
            }
          : {}
        : dailyPrompt.pinned_text?.trim()
          ? {
              prompt_type: "ai-generated" as const,
              prompt_text: dailyPrompt.pinned_text.trim(),
              reflection_day_key: dailyPrompt.reflection_day_key,
            }
          : {}
      : {};

  const handleSave = async () => {
    const currentNote = (textareaRef.current?.value ?? note).slice(0, NOTE_CHAR_MAX);
    const bodyForSave = htmlFromQuickCaptureNote(currentNote);
    const canSaveNow =
      (bodyForSave.length > 0 || attachmentIds.length > 0) &&
      !uploadsPending &&
      !inlineRecorder.recording &&
      !inlineRecorder.busy;
    if (!canSaveNow || !canUse("memory.create")) return;
    setSaveError(null);
    if (!navigator.onLine) {
      try {
        const existing = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]") as unknown[];
        existing.push({
          body: bodyForSave || undefined,
          attachments: attachmentIds.length ? attachmentIds : undefined,
          beneficiaries: !selectedBeneficiaryIds.length ? undefined : selectedBeneficiaryIds,
          ...reflectionExtra,
        });
        localStorage.setItem(OUTBOX_KEY, JSON.stringify(existing));
      } catch {
        toast.error("Could not save offline");
        return;
      }
      toast.message("Saved on this device", {
        description: "We'll sync when you're back online.",
      });
      try {
        localStorage.removeItem(effectiveStorageKey);
      } catch {
        /* ignore */
      }
      close("quick-capture");
      return;
    }

    try {
      const result = await saveThought({
        body: bodyForSave || undefined,
        attachments: attachmentIds.length ? attachmentIds : undefined,
        beneficiaries: !selectedBeneficiaryIds.length ? undefined : selectedBeneficiaryIds,
        ...reflectionExtra,
      });
      if (result?.success) {
        toast.success("Got it. I'll take care of the rest.");
        try {
          localStorage.removeItem(effectiveStorageKey);
        } catch {
          /* ignore */
        }
        mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories));
        mutate((key) => typeof key === "string" && key.split("?")[0] === endpoint.prompts);
        mutate(endpoint.userStats);
        close("quick-capture");
      } else {
        setSaveError("Couldn't save. Check your connection and try again.");
      }
    } catch (err) {
      if (parseSubscriptionGateError(err)) return;
      const errMessage =
        typeof err === "object" && err !== null && "message" in err && typeof err.message === "string"
          ? err.message
          : "Couldn't save. Check your connection and try again.";
      setSaveError(errMessage);
    }
  };

  const handleDismiss = () => {
    const n = note.trim();
    const hasContent = n.length > 0 || files.some((x) => x.uploadedFile || (x.progress ?? 100) < 100);
    if (hasContent) persistDraft();
    else {
      try {
        localStorage.removeItem(effectiveStorageKey);
      } catch {
        /* ignore */
      }
    }
    close("quick-capture");
  };

  const avatarUrl = user?.picture_url || user?.picture;
  const initials =
    user ?
      `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim() || "?"
    : "?";

  const draftKeys = scanQuickCaptureDraftKeys(user?.email);

  const pinnedPrompt =
    dailyPrompt != null ?
      <div className="border-l-2 border-fill-brand-strong pl-3">
        <p className="font-inter text-sm leading-snug text-text-neutral-weak">{dailyPrompt.pinned_text}</p>
      </div>
    : null;

  const draftsPanel =
    draftsOpen ?
      <div className="absolute top-8 right-0 z-20 max-h-64 w-72 overflow-y-auto rounded-xl border border-stroke-neutral-weaker bg-white py-1 shadow-lg">
        {draftKeys.length === 0 ?
          <p className="px-3 py-2 font-inter text-xs text-text-neutral-weaker">No drafts yet.</p>
        : draftKeys.map((k) => {
            const raw = localStorage.getItem(k);
            const d = raw ? parseQuickCaptureDraftJson(raw) : null;
            const preview = d ? quickCaptureDraftPreviewLine(d) : "(empty note)";
            return (
              <button
                key={k}
                type="button"
                className="w-full px-3 py-2 text-left font-inter text-xs text-text-neutral-strong hover:bg-fill-neutral-weaker"
                onClick={() => {
                  try {
                    if (raw) {
                      const parsed = parseQuickCaptureDraftJson(raw);
                      if (parsed) applyDraft(parsed);
                    }
                    setStorageKeyOverride(k);
                  } catch {
                    /* ignore */
                  }
                  setDraftsOpen(false);
                }}
              >
                {preview}
              </button>
            );
          })
        }
      </div>
    : null;

  const headerRow = (
    <div className="relative flex shrink-0 items-center justify-between border-b border-stroke-neutral-weak px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDismiss}
        className="rounded-full text-icon-neutral-strong"
        aria-label="Close"
      >
        <TimesIcon width={12} height={12} />
      </Button>
      <div ref={draftsMenuRef} className="relative">
        <button
          type="button"
          className="font-inter text-sm font-medium text-fill-brand-strong hover:underline"
          onClick={() => setDraftsOpen((o) => !o)}
        >
          Drafts
        </button>
        {draftsPanel}
      </div>
    </div>
  );

  const selectedBeneficiaryNames = beneficiaries
    .filter((b) => b._id && selectedBeneficiaryIds.includes(b._id))
    .map((b) => b.name)
    .filter(Boolean);

  const visibilityLabel =
    selectedBeneficiaryNames.length === 0
      ? "Everyone can see this"
      : selectedBeneficiaryNames.length === 1
        ? `Shared with ${selectedBeneficiaryNames[0]}`
        : `Shared with ${selectedBeneficiaryNames.length} beneficiaries`;

  const privacyRow = (
    <div ref={privacyMenuRef} className="relative shrink-0 border-t border-stroke-neutral-weak px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Globe className="size-4 shrink-0 text-text-neutral-weaker" aria-hidden />
        <button
          type="button"
          id={whoId}
          aria-expanded={whoOpen}
          onClick={() => setWhoOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 font-inter text-xs text-text-neutral-weak hover:text-text-neutral-strong"
        >
          <span>{visibilityLabel}</span>
          {whoOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>
      {whoOpen ? (
        <div className="absolute bottom-full left-4 right-4 z-20 mb-2 rounded-xl border border-stroke-neutral-weaker bg-white p-2 shadow-lg">
          <button
            type="button"
            onClick={() => setSelectedBeneficiaryIds([])}
            className={cn(
              "mb-1 w-full rounded-lg px-2 py-1.5 text-left font-inter text-sm",
              selectedBeneficiaryIds.length === 0
                ? "bg-fill-brand-weak text-text-brand-strong"
                : "hover:bg-fill-neutral-weaker",
            )}
          >
            Everyone
          </button>
          {beneficiaries.length === 0 ? (
            <p className="px-2 py-1.5 font-inter text-xs text-text-neutral-weaker">No beneficiaries yet.</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {beneficiaries.map((b) => {
                const id = b._id;
                if (!id) return null;
                const on = selectedBeneficiaryIds.includes(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBeneficiaryIds((prev) =>
                          on ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left font-inter text-sm",
                        on ? "bg-fill-brand-weak text-text-brand-strong" : "hover:bg-fill-neutral-weaker",
                      )}
                    >
                      {b.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );

  const actionBar = (
    <div
      ref={actionBarRef}
      className="flex shrink-0 items-center justify-between gap-2 border-t border-stroke-neutral-weak bg-v3-bg px-2 py-2"
    >
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploadsPending || recordingUi}
          className="size-10 rounded-xl text-icon-neutral-strong"
          aria-label="Add image"
          onClick={() => fileInputImageRef.current?.click()}
        >
          <ImageIcon className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploadsPending || recordingUi}
          className="size-10 rounded-xl text-icon-neutral-strong"
          aria-label="Add video"
          onClick={() => fileInputVideoRef.current?.click()}
        >
          <Video className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploadsPending || recordingUi}
          className="size-10 rounded-xl text-icon-neutral-strong"
          title="Supported: MP3, WAV, WebM, M4A, OGG, FLAC, AAC"
          aria-label="Attach audio file"
          onClick={() => fileInputAudioRef.current?.click()}
        >
          <Music className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploadsPending || recordingUi}
          className="size-10 rounded-xl text-icon-neutral-strong"
          aria-label={inlineRecorder.recording ? "Stop recording" : "Record voice"}
          onClick={() => {
            setShowInlineRecorder(true);
            inlineRecorder.toggleRecording(uploadsPending);
          }}
        >
          <Mic className="size-5" />
        </Button>
        <div ref={emojiAnchorRef} className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={recordingUi}
            className="size-10 rounded-xl text-icon-neutral-strong"
            aria-label="Emoji"
            onClick={() => setShowEmoji((p) => !p)}
          >
            <Smile className="size-5" />
          </Button>
          {showEmoji &&
            createPortal(
              <div
                ref={emojiPickerPortalRef}
                className="fixed z-[10001]"
                style={(() => {
                  const rect = emojiAnchorRef.current?.getBoundingClientRect();
                  const bar = actionBarRef.current?.getBoundingClientRect();
                  if (rect && bar) {
                    return {
                      left: Math.max(8, rect.left - 120),
                      bottom: window.innerHeight - bar.top + 8,
                    };
                  }
                  return { left: 8, bottom: 80 };
                })()}
              >
                <Card className="overflow-hidden border-stroke-neutral-weak p-0 shadow-lg">
                  <Picker
                    data={emojiData}
                    onEmojiSelect={(e: { native: string }) => insertEmoji(e.native)}
                    theme="light"
                    previewPosition="none"
                  />
                </Card>
              </div>,
              document.body,
            )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CharRing value={note.length} max={NOTE_CHAR_MAX} />
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isMutating}
          className="h-10 rounded-full bg-fill-brand-strong px-5 font-inter text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Save
          <Spinner loading={isMutating} className="size-4!" />
        </Button>
      </div>
    </div>
  );

  const scrollBody = (
    <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
      <div className="flex gap-3 px-4 pb-4 pt-3">
        <div className="sticky top-0 shrink-0 self-start">
          {avatarUrl ?
            <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover ring-1 ring-stroke-neutral-weaker" />
          : (
            <div className="flex size-9 items-center justify-center rounded-full bg-fill-neutral-weaker font-inter text-xs font-semibold text-text-neutral-strong ring-1 ring-stroke-neutral-weaker">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {pinnedPrompt}
          <textarea
            ref={textareaRef}
            id="qc-note"
            value={note}
            onChange={(e) => {
              const v = e.target.value;
              setNote(v.length > NOTE_CHAR_MAX ? v.slice(0, NOTE_CHAR_MAX) : v);
            }}
            placeholder="What's on your mind?"
            rows={2}
            className="w-full resize-none border-0 bg-transparent font-inter text-[15px] leading-relaxed text-text-neutral-strong outline-none placeholder:text-text-neutral-weaker focus:ring-0"
          />
          {showInlineRecorder ? (
            <InlineVoiceRecorder
              recording={inlineRecorder.recording}
              busy={inlineRecorder.busy}
              timerSec={inlineRecorder.timerSec}
              levels={inlineRecorder.levels}
              onToggleRecording={() => inlineRecorder.toggleRecording(uploadsPending)}
              onDismiss={() => setShowInlineRecorder(false)}
              title="Voice recorder"
              idleLabel="Capture a quick voice thought"
              recordingLabel="Listening..."
              error={
                inlineRecorder.micDenied ? "Microphone access is needed to record."
                : inlineRecorder.error
              }
            />
          ) : null}
          {attachError ?
            <p className="font-inter text-xs text-red-600">{attachError}</p>
          : null}
          <QuickCaptureMediaStack files={files} voiceNoteIds={voiceNoteIds} onRemove={handleRemoveFile} />
        </div>
      </div>
    </div>
  );

  const hiddenInputs = (
    <>
      <input
        ref={fileInputImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
      <input
        ref={fileInputVideoRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
      <input
        ref={fileInputAudioRef}
        type="file"
        accept={AUDIO_INPUT_ACCEPT}
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
    </>
  );

  const shell = (
    <div
      className={cn(
        "flex max-h-[90dvh] w-full flex-col overflow-hidden bg-v3-bg",
        isMobile ? "rounded-t-3xl" : "max-w-lg rounded-2xl shadow-2xl ring-1 ring-stroke-neutral-weak",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="sr-only">Quick capture</h2>
      {headerRow}
      {scrollBody}
      {privacyRow}
      {saveError ?
        <p className="shrink-0 px-4 pb-1 font-inter text-sm text-red-600">{saveError}</p>
      : null}
      {actionBar}
      {hiddenInputs}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet detent="content" isOpen onClose={handleDismiss} snapPoints={[0, 0.8]} initialSnap={1}>
        <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-v3-bg">
          <Sheet.Header className="rounded-t-3xl bg-v3-bg" />
          <Sheet.Content className="flex max-h-[80dvh] min-h-0 flex-col overflow-hidden bg-v3-bg px-0 pb-0">
            {shell}
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={handleDismiss} />
      </Sheet>
    );
  }

  return shell;
}

