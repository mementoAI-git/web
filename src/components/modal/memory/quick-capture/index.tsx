"use client";

import { UserAvatar } from "@/components/user-avatar";
import { reportFetcherError } from "@/api/report-fetcher-error";

import { getProfileAvatarUrl } from "@/utility/profile-avatar";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { X, Square, Plus, ImageIcon, Video, Music, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";

import { useModal } from "@/hooks/use-modal";
import { useDismissOnOutsidePress } from "@/hooks/use-dismiss-on-outside-press";
import { useStore } from "@/hooks/use-store";
import { useOverviewDictation } from "@/pages/dashboard/overview/sections/use-overview-dictation";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { useTheme } from "@/contexts/theme";
import useFileUpload from "@/hooks/use-file-upload";
import endpoint from "@/api/endpoint";
import { postFetcher, postJsonQuiet } from "@/api/fetcher";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import { cn } from "@/utility";
import { parseSubscriptionGateError } from "@/features/pricing/subscription-errors";
import {
  MEMORY_ACCEPT_DOCUMENTS,
  SUPPORTED_FILE_TYPES,
  inferMimeType,
  isSupportedFileMime,
  uploadMimeBaseType,
} from "@/utility/constant";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Spinner from "@/components/spinner";
import { AudiencePicker } from "./audience-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import closeIcon from "@/assets/icon/quick-story/imgX.svg";
import draftsChevron from "@/assets/icon/quick-story/imgIconRight.svg";
import emojiIcon from "@/assets/icon/quick-story/imgNotoSlightlySmilingFace.svg";
import micIcon from "@/assets/icon/quick-story/imgMicrophone01.svg";
import videoIcon from "@/assets/icon/quick-story/imgVideoRecorder.svg";
import type {
  IBeneficiary,
  IGroup,
  IOnUploadPayload,
} from "@/utility/interface";
import { QuickCaptureMediaStack } from "./media-stack";
import type {
  DailyPromptCapturePayload,
  QuickCaptureDraft,
} from "@/lib/quick-capture-drafts";
import posthog from "@/lib/posthog";
import {
  htmlFromQuickCaptureNote,
  parseQuickCaptureDraftJson,
  plainTextFromQuickCaptureNote,
  quickCaptureDraftPreviewLine,
  quickCaptureDraftStorageKey,
  scanQuickCaptureDraftKeys,
} from "@/lib/quick-capture-drafts";

export type { DailyPromptCapturePayload } from "@/lib/quick-capture-drafts";

type QuickCaptureModalData = {
  daily_prompt?: DailyPromptCapturePayload;
};

const syncingOutboxes = new Set<string>();
const QUICK_MAX_MB = 15;
const MAX_FILE_BYTES = QUICK_MAX_MB * 1024 * 1024;
const NOTE_CHAR_MAX = 8000;
const REFLECTION_DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  const { close, registerCloseGuard } = useModal();
  const { user } = useStore();
  const outboxKey = user?._id ? `quick-capture-outbox:${user._id}` : null;
  const syncOwner = useRef(outboxKey);
  syncOwner.current = outboxKey;
  useEffect(() => {
    syncOwner.current = outboxKey;
    return () => {
      syncOwner.current = null;
    };
  }, [outboxKey]);
  const completed = useRef(false);
  const savingRef = useRef(false);
  useEffect(
    () => registerCloseGuard?.("quick-capture", () => !savingRef.current),
    [registerCloseGuard],
  );
  const { canUse } = useFeatureFlags();
  const { resolvedTheme } = useTheme();

  const [note, setNote] = useState("");
  const [voiceNoteIds, setVoiceNoteIds] = useState<Record<string, true>>({});
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<
    string[]
  >([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"private" | "everyone">(
    "private",
  );
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);
  const fileInputAudioRef = useRef<HTMLInputElement>(null);
  const fileInputDocsRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const draftsMenuRef = useRef<HTMLDivElement>(null);
  const emojiAnchorRef = useRef<HTMLDivElement>(null);
  const emojiPickerPortalRef = useRef<HTMLDivElement>(null);

  const [draftsOpen, setDraftsOpen] = useState(false);
  const [storageKeyOverride, setStorageKeyOverride] = useState<string | null>(
    null,
  );
  const [showEmoji, setShowEmoji] = useState(false);

  const effectiveStorageKey =
    storageKeyOverride ?? quickCaptureDraftStorageKey(user?.email, dailyPrompt);

  const noteRef = useRef(note);
  const filesRef = useRef(files);
  const voiceIdsRef = useRef(voiceNoteIds);
  const beneficiariesRef = useRef(selectedBeneficiaryIds);
  const audienceRef = useRef({ selectedGroupIds, visibility });
  const ctxRef = useRef({
    email: user?.email,
    daily: dailyPrompt,
    key: effectiveStorageKey,
  });
  useEffect(() => {
    noteRef.current = note;
    filesRef.current = files;
    voiceIdsRef.current = voiceNoteIds;
    beneficiariesRef.current = selectedBeneficiaryIds;
    audienceRef.current = { selectedGroupIds, visibility };
    ctxRef.current = {
      email: user?.email,
      daily: dailyPrompt,
      key: effectiveStorageKey,
    };
  }, [
    note,
    files,
    voiceNoteIds,
    selectedBeneficiaryIds,
    selectedGroupIds,
    visibility,
    user?.email,
    dailyPrompt,
    effectiveStorageKey,
  ]);

  const {
    data: beneficiariesRes,
    error: beneficiariesError,
    isLoading: beneficiariesLoading,
  } = useSWR(
    `${endpoint.beneficiaries}?page=1&limit=100`,
    paginatedResponseFetcher<IBeneficiary>,
  );
  const beneficiaries: IBeneficiary[] = beneficiariesRes?.data?.docs ?? [];
  const {
    data: groupsRes,
    error: groupsError,
    isLoading: groupsLoading,
  } = useSWR(
    `${endpoint.groups}?page=1&limit=100`,
    paginatedResponseFetcher<IGroup>,
  );
  const groups = groupsRes?.data?.docs ?? [];
  const saveEndpoint =
    visibility === "everyone" || selectedGroupIds.length
      ? endpoint.memories
      : endpoint.memoriesQuickCapture;

  const { trigger: saveThought, isMutating } = useSWRMutation(
    saveEndpoint,
    postFetcher,
  );

  const attachmentIds = files
    .filter(
      (
        f,
      ): f is IOnUploadPayload & {
        uploadedFile: NonNullable<IOnUploadPayload["uploadedFile"]>;
      } => Boolean(f.uploadedFile?._id),
    )
    .map((f) => f.uploadedFile._id);

  const uploadsPending = files.some((f) => f.progress !== 100);
  const recording = useOverviewDictation((text) => {
    setNote((previous) =>
      `${previous}${previous.trim() && !/\s$/.test(previous) ? " " : ""}${text}`.slice(
        0,
        NOTE_CHAR_MAX,
      ),
    );
    requestAnimationFrame(() => textareaRef.current?.focus());
  });
  const recordingUi = recording.phase !== "idle";

  const persistToKey = useCallback(
    (key: string) => {
      if (completed.current) return;
      const payload: QuickCaptureDraft = {
        note,
        selectedBeneficiaryIds,
        selectedGroupIds,
        visibility,
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
            durationSec:
              typeof f.duration === "number" ? f.duration : undefined,
          })),
      };
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        toast.error(
          "Draft couldn’t be saved on this device. Keep this window open.",
          { id: "quick-capture-storage" },
        );
      }
    },
    [
      note,
      selectedBeneficiaryIds,
      selectedGroupIds,
      visibility,
      dailyPrompt,
      files,
      voiceNoteIds,
    ],
  );

  const persistDraft = useCallback(
    () => persistToKey(effectiveStorageKey),
    [persistToKey, effectiveStorageKey],
  );

  const applyDraft = useCallback(
    (d: QuickCaptureDraft) => {
      const nextNote = typeof d.note === "string" ? d.note : "";
      setNote(nextNote);
      setSelectedBeneficiaryIds(
        Array.isArray(d.selectedBeneficiaryIds) ? d.selectedBeneficiaryIds : [],
      );
      setSelectedGroupIds(d.selectedGroupIds ?? []);
      setVisibility(d.visibility ?? "private");
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
  }, [
    user?.email,
    dailyPrompt?.prompt_id,
    dailyPrompt?.pinned_text,
    dailyPrompt?.reflection_day_key,
    dailyPrompt?.prompt_type,
  ]);

  useDismissOnOutsidePress({
    active: draftsOpen,
    onDismiss: () => setDraftsOpen(false),
    rootRefs: [draftsMenuRef],
  });
  useDismissOnOutsidePress({
    active: showEmoji,
    onDismiss: () => setShowEmoji(false),
    rootRefs: [emojiAnchorRef, emojiPickerPortalRef],
  });

  useEffect(() => {
    if (!draftsOpen && !showEmoji) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      if (draftsOpen) setDraftsOpen(false);
      if (showEmoji) setShowEmoji(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [draftsOpen, showEmoji]);

  useEffect(() => {
    return () => {
      if (completed.current) return;
      const { daily, key } = ctxRef.current;
      const n = plainTextFromQuickCaptureNote(noteRef.current).trim();
      const f = filesRef.current;
      const hasContent =
        n.length > 0 ||
        f.some((x) => x.uploadedFile || (x.progress ?? 100) < 100);
      try {
        if (hasContent) {
          const payload: QuickCaptureDraft = {
            note: noteRef.current,
            selectedBeneficiaryIds: beneficiariesRef.current,
            ...audienceRef.current,
            ...(daily
              ? { daily_prompt: daily as DailyPromptCapturePayload }
              : {}),
            attachments: f
              .filter((x) => x.uploadedFile?._id)
              .map((x) => ({
                clientId: x.id,
                _id: x.uploadedFile!._id,
                url: x.uploadedFile!.url,
                name: x.uploadedFile!.name,
                type: x.uploadedFile!.type,
                kind: voiceIdsRef.current[x.id]
                  ? ("voice" as const)
                  : ("file" as const),
                durationSec:
                  typeof x.duration === "number" ? x.duration : undefined,
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
    const max =
      typeof window !== "undefined"
        ? Math.min(window.innerHeight * 0.35, 280)
        : 280;
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
      if (!canUse("attachments.doc_upload")) {
        toast.error("File uploads are currently disabled.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`File is too large. Max size is ${QUICK_MAX_MB}MB.`);
        return;
      }
      const resolvedType = file.type || inferMimeType(file.name);
      if (!isSupportedFileMime(resolvedType, SUPPORTED_FILE_TYPES)) {
        toast.error("That file type isn't supported.");
        return;
      }
      if (
        uploadMimeBaseType(resolvedType).startsWith("image/") &&
        !canUse("attachments.image_upload")
      ) {
        toast.error("Image uploads are currently disabled.");
        return;
      }
      if (
        uploadMimeBaseType(resolvedType).startsWith("video/") &&
        !canUse("attachments.video_upload")
      ) {
        toast.error("Video uploads are currently disabled.");
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

  const canSave =
    (note.trim().length > 0 || attachmentIds.length > 0) &&
    !uploadsPending &&
    !recordingUi &&
    !recording.canRetry;

  const flushOutbox = useCallback(async () => {
    if (!navigator.onLine || !outboxKey || syncingOutboxes.has(outboxKey))
      return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(outboxKey);
    } catch {
      return;
    }
    if (!raw) return;
    let queue: unknown[] = [];
    try {
      queue = JSON.parse(raw) as unknown[];
    } catch {
      toast.error(
        "Queued notes could not be read. They have been kept on this device.",
      );
      return;
    }
    if (!Array.isArray(queue)) return;
    syncingOutboxes.add(outboxKey);
    const synced = new Set<string>();
    let syncFailed = false;
    try {
      for (const item of queue) {
        if (syncOwner.current !== outboxKey) break;
        const entry = item as {
          _queue_id?: string;
          body?: string;
          save_endpoint?: string;
          visibility?: "private" | "everyone";
          groups?: string[];
          attachments?: string[];
          beneficiaries?: string[];
          transcript_uncertain?: boolean;
          prompt_type?: string;
          prompt_id?: string;
          prompt_text?: string;
          reflection_day_key?: string;
        };
        const ok = await postJsonQuiet(
          entry.save_endpoint === endpoint.memories
            ? endpoint.memories
            : endpoint.memoriesQuickCapture,
          {
            ...(entry.save_endpoint === endpoint.memories
              ? {
                  visibility: entry.visibility,
                  groups: entry.groups,
                  status: "save",
                  capture_source: "quick",
                }
              : {}),
            body: entry.body,
            attachments: entry.attachments,
            beneficiaries: entry.beneficiaries,
            transcript_uncertain: entry.transcript_uncertain,
            prompt_type: entry.prompt_type,
            prompt_id: entry.prompt_id,
            prompt_text: entry.prompt_text,
            reflection_day_key: entry.reflection_day_key,
          },
        );
        if (ok && entry._queue_id) synced.add(entry._queue_id);
        if (!ok) syncFailed = true;
      }
      try {
        const latest = JSON.parse(localStorage.getItem(outboxKey) || "[]") as {
          _queue_id?: string;
        }[];
        const next = latest.filter(
          (item) => !item._queue_id || !synced.has(item._queue_id),
        );
        if (next.length) localStorage.setItem(outboxKey, JSON.stringify(next));
        else localStorage.removeItem(outboxKey);
        if (synced.size > 0) {
          void mutate(
            (key) =>
              typeof key === "string" && key.startsWith(endpoint.stories),
          ).catch(() => undefined);
          void mutate(
            (key) =>
              typeof key === "string" && key.split("?")[0] === endpoint.prompts,
          ).catch(() => undefined);
          void mutate(endpoint.userStats).catch(() => undefined);
        }
      } catch {
        /* ignore */
      }
      if (syncFailed)
        toast.error(
          "Some notes are still saved only on this device. Reopen Quick capture to retry.",
        );
    } finally {
      syncingOutboxes.delete(outboxKey);
    }
  }, [outboxKey]);

  useEffect(() => {
    void flushOutbox().catch(() =>
      toast.error("Couldn’t sync queued notes. They remain on this device."),
    );
    const sync = () => {
      void flushOutbox().catch(() =>
        toast.error("Couldn’t sync queued notes. They remain on this device."),
      );
    };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [flushOutbox]);

  const reflectionExtra =
    dailyPrompt != null &&
    REFLECTION_DAY_KEY_RE.test(dailyPrompt.reflection_day_key)
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
    const currentNote = (textareaRef.current?.value ?? note).slice(
      0,
      NOTE_CHAR_MAX,
    );
    const bodyForSave = htmlFromQuickCaptureNote(currentNote);
    const canSaveNow =
      (bodyForSave.length > 0 || attachmentIds.length > 0) &&
      !uploadsPending &&
      !recordingUi &&
      !recording.canRetry;
    if (
      savingRef.current ||
      completed.current ||
      !canSaveNow ||
      !canUse("memory.create")
    )
      return;
    if (!navigator.onLine) {
      if (!outboxKey) {
        toast.error("Sign in before saving a note offline.");
        return;
      }
      try {
        const existing = JSON.parse(
          localStorage.getItem(outboxKey) || "[]",
        ) as unknown[];
        existing.push({
          _queue_id: uuidv4(),
          save_endpoint: saveEndpoint,
          visibility,
          groups: selectedGroupIds,
          body: bodyForSave || undefined,
          attachments: attachmentIds.length ? attachmentIds : undefined,
          beneficiaries: !selectedBeneficiaryIds.length
            ? undefined
            : selectedBeneficiaryIds,
          ...reflectionExtra,
        });
        localStorage.setItem(outboxKey, JSON.stringify(existing));
      } catch {
        toast.error("Could not save offline");
        return;
      }
      toast.message("Saved on this device", {
        description: "Reopen Quick capture when you’re online to sync.",
      });
      try {
        localStorage.removeItem(effectiveStorageKey);
      } catch {
        /* ignore */
      }
      completed.current = true;
      close("quick-capture");
      return;
    }

    savingRef.current = true;
    try {
      const result = await saveThought({
        ...(saveEndpoint === endpoint.memories
          ? {
              visibility,
              groups: selectedGroupIds,
              status: "save",
              capture_source: "quick",
            }
          : {}),
        body: bodyForSave || undefined,
        attachments: attachmentIds.length ? attachmentIds : undefined,
        beneficiaries: !selectedBeneficiaryIds.length
          ? undefined
          : selectedBeneficiaryIds,
        ...reflectionExtra,
      });
      if (result?.success) {
        if (posthog.__loaded) {
          posthog.capture("quick_note_saved", {
            attachment_count: attachmentIds.length,
            beneficiary_count: selectedBeneficiaryIds.length,
            from_daily_prompt: Boolean(dailyPrompt),
          });
        }
        completed.current = true;
        toast.success(
          "Note saved. Details will finish processing in the background.",
        );
        try {
          localStorage.removeItem(effectiveStorageKey);
        } catch {
          /* ignore */
        }
        void mutate(
          (key) => typeof key === "string" && key.startsWith(endpoint.stories),
        ).catch(() => undefined);
        void mutate(
          (key) =>
            typeof key === "string" && key.split("?")[0] === endpoint.prompts,
        ).catch(() => undefined);
        void mutate(endpoint.userStats).catch(() => undefined);
        savingRef.current = false;
        close("quick-capture");
      } else {
        toast.error("Couldn’t save. Your draft is still here. Try again.");
      }
    } catch (err) {
      if (parseSubscriptionGateError(err)) return;
      const errMessage =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Couldn't save. Check your connection and try again.";
      reportFetcherError(err, errMessage);
    } finally {
      savingRef.current = false;
    }
  };

  const handleDismiss = () => {
    if (savingRef.current) return;
    const n = plainTextFromQuickCaptureNote(note).trim();
    const hasContent =
      n.length > 0 ||
      files.some((x) => x.uploadedFile || (x.progress ?? 100) < 100);
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

  const avatarUrl = getProfileAvatarUrl(user);


  const draftKeys = scanQuickCaptureDraftKeys(user?.email);

  const pinnedPrompt =
    dailyPrompt != null ? (
      <div className="border-l-2 border-fill-brand-strong pl-3">
        <p className="font-inter text-sm leading-snug text-text-neutral-weak">
          {dailyPrompt.pinned_text}
        </p>
      </div>
    ) : null;

  const draftsPanel = draftsOpen ? (
    <div className="absolute top-8 right-0 z-20 max-h-64 w-72 overflow-y-auto rounded-xl border border-stroke-neutral-weaker bg-popover py-1 shadow-lg">
      {draftKeys.length === 0 ? (
        <p className="px-3 py-2 font-inter text-xs text-text-neutral-weaker">
          No drafts yet.
        </p>
      ) : (
        draftKeys.map((k) => {
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
      )}
    </div>
  ) : null;

  const headerRow = (
    <div className="relative flex shrink-0 items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDismiss}
        className="rounded-full bg-fill-neutral-weak text-icon-neutral-strong"
        aria-label="Close"
      >
        <img src={closeIcon} alt="" className="dark:invert" />
      </Button>
      <div ref={draftsMenuRef} className="relative">
        <button
          type="button"
          aria-expanded={draftsOpen}
          disabled={recordingUi || isMutating}
          className="flex h-8 items-center gap-2 rounded-md border border-stroke-neutral-weak px-4 text-sm font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-stroke-brand-strong"
          onClick={() => setDraftsOpen((o) => !o)}
        >
          Drafts <img src={draftsChevron} alt="" className="dark:invert" />
        </button>
        {draftsPanel}
      </div>
    </div>
  );

  const privacyRow = (
    <AudiencePicker
      value={{
        visibility,
        people: selectedBeneficiaryIds,
        groups: selectedGroupIds,
      }}
      onChange={(audience) => {
        setVisibility(audience.visibility);
        setSelectedBeneficiaryIds(audience.people);
        setSelectedGroupIds(audience.groups);
      }}
      people={beneficiaries}
      groups={groups}
      loading={groupsLoading || beneficiariesLoading}
      error={Boolean(groupsError || beneficiariesError)}
      disabled={isMutating}
    />
  );

  const actionBar = (
    <div
      ref={actionBarRef}
      className="flex shrink-0 items-center justify-between gap-2"
    >
      <div className="flex items-center gap-3 max-[400px]:gap-0">
        <DropdownMenu modal={false} onOpenChange={(open) => { if (open) setShowEmoji(false); }}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={uploadsPending || recordingUi || isMutating}
              className="size-10 rounded-[10px] bg-fill-neutral-strong text-text-inverse-strong hover:bg-fill-neutral-strong/90 dark:bg-fill-neutral-weak dark:text-icon-neutral-strong dark:hover:bg-fill-neutral-weaker"
              aria-label="Add attachment"
            >
              <Plus aria-hidden className="size-5" strokeWidth={1.66667} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="z-[10001]"
            onEscapeKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Choose upload type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => fileInputImageRef.current?.click()}>
                <ImageIcon />
                Photos
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputVideoRef.current?.click()}>
                <Video />
                Videos
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputAudioRef.current?.click()}>
                <Music />
                Audio
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputDocsRef.current?.click()}>
                <Paperclip />
                Documents
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <img src={emojiIcon} alt="" />
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
                    onEmojiSelect={(e: { native: string }) =>
                      insertEmoji(e.native)
                    }
                    theme={resolvedTheme}
                    previewPosition="none"
                  />
                </Card>
              </div>,
              document.body,
            )}
        </div>
        <span aria-hidden className="h-6 border-l border-stroke-neutral-weak" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-10 rounded-[10px]",
            recordingUi &&
              "border border-stroke-neutral-weak bg-fill-neutral-weak",
          )}
          disabled={uploadsPending || recordingUi || isMutating}
          aria-label="Record voice"
          onClick={() => void recording.start()}
        >
          <img src={micIcon} alt="" className="dark:invert" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-[10px]"
          disabled={uploadsPending || recordingUi || isMutating}
          aria-label="Add video"
          onClick={() => fileInputVideoRef.current?.click()}
        >
          <img src={videoIcon} alt="" className="dark:invert" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave || isMutating}
          className="h-10 rounded-lg px-[18px] text-sm font-bold disabled:opacity-50"
        >
          Publish
          <Spinner loading={isMutating} className="size-4!" />
        </Button>
      </div>
    </div>
  );

  const scrollBody = (
    <div className="hide-scrollbar min-h-0 overflow-y-auto">
      <div
        className={cn(
          "flex items-start gap-2",
          !files.length && "min-h-[122px]",
        )}
      >
        {!note && (
          <div data-testid="quick-story-avatar" className="shrink-0">
            <UserAvatar alt="Your avatar" src={avatarUrl} userId={user?._id} email={user?.email} name={[user?.first_name, user?.last_name].filter(Boolean).join(" ")} size="lg" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {pinnedPrompt}
          <textarea
            ref={textareaRef}
            readOnly={isMutating || recordingUi}
            id="qc-note"
            aria-label="Story"
            value={plainTextFromQuickCaptureNote(note)}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_CHAR_MAX))}
            placeholder="What's on your mind?"
            rows={2}
            className="w-full resize-none border-0 bg-transparent text-base leading-6 text-text-neutral-strong outline-none placeholder:text-text-neutral-weaker focus:ring-0"
          />
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-6">
          <QuickCaptureMediaStack
            files={files}
            voiceNoteIds={voiceNoteIds}
            onRemove={handleRemoveFile}
          />
        </div>
      )}
    </div>
  );
  const recorderRow = (
    <div className="flex flex-col gap-2">
      <div className="flex h-10 items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Cancel recording"
          onClick={recording.cancel}
          className="size-10 rounded-full border-stroke-neutral-strong bg-transparent"
        >
          <X className="size-5" />
        </Button>
        <div
          className="flex h-10 min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden"
          aria-hidden
        >
          {recording.levels.map((height, i) => (
            <span
              key={i}
              className="w-1 shrink-0 rounded-full bg-icon-neutral-weak"
              style={{ height }}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={
            recording.phase === "starting" || recording.phase === "transcribing"
          }
          aria-label="Stop recording and transcribe"
          onClick={recording.stop}
          className="size-10 rounded-full border-stroke-neutral-strong bg-transparent"
        >
          <Square className="size-4 fill-current text-icon-brand-strong" />
        </Button>
      </div>
      <div
        role="status"
        className="flex items-center justify-between text-xs text-text-neutral-weak"
      >
        <span>
          {recording.phase === "transcribing"
            ? "Transcribing…"
            : recording.phase === "starting"
              ? "Starting…"
              : `${recording.phase === "paused" ? "Paused" : "Recording"} · ${Math.floor(recording.seconds / 60)}:${String(recording.seconds % 60).padStart(2, "0")}`}
        </span>

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
      <input
        ref={fileInputDocsRef}
        type="file"
        accept={MEMORY_ACCEPT_DOCUMENTS}
        aria-label="Upload documents"
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />
    </>
  );

  const shell = (
    <div
      className={cn(
        "flex max-h-[90dvh] w-full flex-col gap-6 overflow-y-auto bg-bg-raised p-6 font-geist text-text-neutral-strong",
        isMobile
          ? "rounded-t-3xl"
          : "max-w-[456px] rounded-3xl shadow-2xl ring-1 ring-stroke-neutral-weak",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="sr-only">Quick capture</h2>
      {headerRow}
      {scrollBody}
      {recordingUi ? recorderRow : privacyRow}
      {recording.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 text-xs text-text-error-strong"
        >
          {recording.error}
          {recording.canRetry && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void recording.retry()}
              >
                Retry transcription
              </Button>
              <Button variant="ghost" size="sm" onClick={recording.cancel}>
                Discard recording
              </Button>
            </>
          )}
        </div>
      )}
      {actionBar}
      {hiddenInputs}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet
        detent="content"
        isOpen
        onClose={handleDismiss}
        snapPoints={[0, 1]}
        initialSnap={1}
      >
        <Sheet.Container
          className="max-h-[80dvh] overflow-hidden"
          style={{ backgroundColor: "var(--bg-raised)" }}
        >
          <Sheet.Header className="rounded-t-3xl" />
          <Sheet.Content className="flex max-h-[80dvh] min-h-0 flex-col overflow-hidden px-0 pb-0">
            {shell}
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={handleDismiss} />
      </Sheet>
    );
  }

  return shell;
}
