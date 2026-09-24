import { TimesIcon } from "@/components/icons";
import { cn, toBase64 } from "@/utility";
import { toast } from "sonner";
import {
  type ChatReplyQuote,
  snippetReplyText,
} from "@/utility/chat-reply-prompt";
import React, {
  type ClipboardEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Voiceinput from "./Voiceinput";
import Spinner from "../spinner";
import useFileUpload from "@/hooks/use-file-upload";
import { type IFile, type IOnUploadPayload } from "@/utility/interface";
import { v4 as uuidv4 } from "uuid";
import ImagePreview from "./ImagePreveiw";
import { isEmpty } from "lodash";
import { SUPPORTED_FILE_TYPES, inferMimeType, isSupportedFileMime } from "@/utility/constant";
import { getTextareaCaretCoordinates } from "@/utility/textarea-caret";
import { SlashCommandPopup } from "@/components/memory/text-area/slash-command-popup";
import {
  CHAT_SLASH_COMMANDS,
  type ChatSlashCommandItem,
} from "./chat-slash-commands";
import { ArrowUp, Mic, Paperclip, Phone } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export interface IOnSendPayload {
  attachments?: IFile[];
  text: string;
  /** Quoted message context (embedded in the prompt on send). */
  replyTo?: ChatReplyQuote | null;
}

export type { ChatReplyQuote };

export interface IChatinputProps {
  className?: string
  inputClassName?: string
  typing?: boolean
  loading?: boolean
  onChangeText?: (str: string) => void;
  onSend?: (p: IOnSendPayload) => void
  onStop?: () => void
  memoryId?: string | null
  history?: { role: "user" | "ai", text: string }[]
  /** When set, draft text is restored from and saved to localStorage (text only). */
  draftStorageKey?: string | null
  /** Message being replied to; shown above the field until send or clear. */
  replyQuote?: ChatReplyQuote | null;
  onClearReplyQuote?: () => void;
}

type ChatinputImplProps = IChatinputProps & {
  wrapperClassName: string
  shellTestId?: string
}

function ChatinputImpl({
  wrapperClassName,
  shellTestId,
  className = "",
  inputClassName = "",
  typing = false,
  loading = false,
  onStop,
  onSend,
  memoryId,
  history = [],
  draftStorageKey = null,
  replyQuote = null,
  onClearReplyQuote,
}: ChatinputImplProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const voiceRouteMatch = location.pathname.match(/^\/chat\/([^/]+)\/voice\/?$/);
  const voiceRouteChatId = voiceRouteMatch?.[1] ?? null;
  const isVoiceCallRoute = Boolean(voiceRouteChatId);
  const pathChatId = location.pathname.match(/^\/chat\/([^/]+)\/?$/)?.[1];
  const voiceNavTargetId = memoryId ?? pathChatId ?? null;
  const voiceCallTo =
    voiceNavTargetId ? `/chat/${voiceNavTargetId}/voice` : null;

  const readDraft = useCallback(() => {
    if (!draftStorageKey || typeof localStorage === "undefined") return "";
    try {
      return localStorage.getItem(draftStorageKey) ?? "";
    } catch {
      return "";
    }
  }, [draftStorageKey]);

  const [text, setText] = useState("")
  /** Voice UI when URL is …/chat/:id/voice or user chose voice without a chat URL (e.g. landing). */
  const [inlineVoiceOpen, setInlineVoiceOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const quickRecRef = useRef<MediaRecorder | null>(null)
  const quickChunksRef = useRef<Blob[]>([])
  const quickStreamRef = useRef<MediaStream | null>(null)
  /** Prevents double-applying `?starter=` when layout re-runs before navigation replaces the URL. */
  const starterAppliedPathKeyRef = useRef<string | null>(null)

  const [isQuickRecording, setIsQuickRecording] = useState(false)

  const { files, handleUpload, setFiles, handleDeleteFile } = useFileUpload();

  const isVoiceMode = isVoiceCallRoute || inlineVoiceOpen;

  const textBeforeCursor = text.slice(0, cursorPosition)
  const lastSlashIndex = textBeforeCursor.lastIndexOf("/")
  const slashQuery = lastSlashIndex === -1 ? "" : textBeforeCursor.slice(lastSlashIndex + 1)
  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return CHAT_SLASH_COMMANDS
    const q = slashQuery.toLowerCase()
    return CHAT_SLASH_COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.shortcut?.toLowerCase().includes(q) ?? false),
    )
  }, [slashQuery])
  const clampedSlashIndex = Math.min(
    slashSelectedIndex,
    Math.max(0, filteredSlashCommands.length - 1),
  )

  useEffect(() => {
    if (lastSlashIndex === -1 || slashQuery.includes(" ") || slashQuery.includes("\n")) {
      setShowSlashMenu(false)
    } else {
      if (slashQuery === "") setSlashSelectedIndex(0)
      setShowSlashMenu(true)
      const el = textareaRef.current
      if (el) {
        const coords = getTextareaCaretCoordinates(el, cursorPosition)
        if (coords) {
          setSlashPosition({ top: coords.top + 20, left: coords.left })
        } else if (inputWrapperRef.current) {
          const rect = inputWrapperRef.current.getBoundingClientRect()
          setSlashPosition({ top: rect.bottom + 4, left: rect.left })
        }
      }
    }
  }, [lastSlashIndex, slashQuery, cursorPosition])

  useEffect(() => {
    setSlashSelectedIndex((i) => Math.min(i, Math.max(0, filteredSlashCommands.length - 1)))
  }, [filteredSlashCommands.length])

  useEffect(() => {
    if (showSlashMenu && filteredSlashCommands.length === 0) setShowSlashMenu(false)
  }, [showSlashMenu, filteredSlashCommands.length])

  useLayoutEffect(() => {
    if (!draftStorageKey) {
      setText("");
      starterAppliedPathKeyRef.current = null;
      return;
    }

    const pathKey = `${location.pathname}:${draftStorageKey}`;
    const params = new URLSearchParams(location.search);
    const starter = params.get("starter");

    if (starter && starterAppliedPathKeyRef.current !== pathKey) {
      let decoded = starter;
      try {
        decoded = decodeURIComponent(starter);
      } catch {
        /* keep raw */
      }
      const trimmed = decoded.trim().slice(0, 4000);
      if (trimmed) {
        starterAppliedPathKeyRef.current = pathKey;
        try {
          localStorage.setItem(draftStorageKey, trimmed);
        } catch {
          /* ignore */
        }
        setText(trimmed);
        params.delete("starter");
        const nextSearch = params.toString();
        navigate(
          { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
          { replace: true },
        );
        return;
      }
    }

    if (!starter) {
      starterAppliedPathKeyRef.current = null;
    }
    setText(readDraft());
  }, [draftStorageKey, readDraft, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!draftStorageKey) return;
    const t = window.setTimeout(() => {
      try {
        if (text.trim()) {
          localStorage.setItem(draftStorageKey, text);
        } else {
          localStorage.removeItem(draftStorageKey);
        }
      } catch {
        /* ignore quota / private mode */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [text, draftStorageKey]);

  const MAX_TEXTAREA_HEIGHT = 300;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const contentHeight = textarea.scrollHeight;
    const nextHeight = Math.min(contentHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      contentHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  const processFileForUpload = useCallback(
    async (file: File) => {
      const resolvedType = file.type || inferMimeType(file.name);
      if (!isSupportedFileMime(resolvedType, SUPPORTED_FILE_TYPES)) {
        toast.error(
          "Please select a supported file type (images, PDF, video, or audio)",
        );
        return;
      }

      // Match API multer limit (api/src/middleware/file-upload.ts)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 15MB");
        return;
      }

      const base64 = await toBase64(file);

      const uploadPayload: IOnUploadPayload = {
        id: uuidv4(),
        file,
        progress: 0,
        base64,
      };

      await handleUpload(uploadPayload);
    },
    [handleUpload],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      e.target.value = "";
      for (const file of selected) {
        await processFileForUpload(file);
      }
    },
    [processFileForUpload],
  );

  const finishQuickRecorderBlob = useCallback(
    async (mimeType: string) => {
      quickStreamRef.current?.getTracks().forEach((t) => t.stop());
      quickStreamRef.current = null;
      quickRecRef.current = null;
      setIsQuickRecording(false);
      const blob = new Blob(quickChunksRef.current, { type: mimeType });
      quickChunksRef.current = [];
      if (blob.size === 0) return;
      const ext = mimeType.startsWith("audio/webm") ? "webm" : "mp4";
      const file = new File([blob], `voice-clip-${Date.now()}.${ext}`, {
        type: mimeType.split(";")[0]?.trim() || mimeType,
      });
      await processFileForUpload(file);
    },
    [processFileForUpload],
  );

  const toggleQuickRecording = useCallback(async () => {
    const existing = quickRecRef.current;
    if (existing && existing.state === "recording") {
      existing.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      quickStreamRef.current = stream;
      quickChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType });
      quickRecRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) quickChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        void finishQuickRecorderBlob(mimeType);
      };
      rec.start();
      setIsQuickRecording(true);
    } catch {
      alert("Microphone access is needed to record a voice clip.");
    }
  }, [finishQuickRecorderBlob]);

  useEffect(() => {
    return () => {
      quickStreamRef.current?.getTracks().forEach((t) => t.stop());
      quickStreamRef.current = null;
    };
  }, []);

  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const dt = e.clipboardData;
      if (!dt) return;

      const tryImageUpload = async (file: File | null) => {
        if (!file) return false;
        const resolved = file.type || inferMimeType(file.name);
        if (!resolved.startsWith("image/")) return false;
        e.preventDefault();
        await processFileForUpload(file);
        return true;
      };

      if (dt.files?.length) {
        for (let i = 0; i < dt.files.length; i += 1) {
          const file = dt.files.item(i);
          if (await tryImageUpload(file)) return;
        }
      }

      for (let i = 0; i < (dt.items?.length ?? 0); i += 1) {
        const item = dt.items[i];
        if (item?.kind === "file") {
          const file = item.getAsFile();
          if (await tryImageUpload(file)) return;
        }
      }
    },
    [processFileForUpload],
  );

  const handleSend = () => {
    if (!isEmpty(files) && files.every(f => f.progress < 100)) {
      return;
    }
    if (!text.trim() && files.length === 0) {
      return;
    }

    const attachments = files
      .filter(f => f.uploadedFile)
      .map(f => f.uploadedFile);

    const payload: IOnSendPayload = {
      text,
      attachments,
      replyTo: replyQuote ?? null,
    };
    onSend?.(payload);
    if (draftStorageKey) {
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        /* ignore */
      }
    }
    setText("");
    setFiles([]);
  }

  const handleSlashCommandSelect = useCallback(
    (command: ChatSlashCommandItem) => {
      const start = lastSlashIndex
      const end = cursorPosition
      const insert = command.textToInsert
      const offset = command.cursorOffsetAfterInsert ?? insert.length
      const newText = text.slice(0, start) + insert + text.slice(end)
      setText(newText)
      setShowSlashMenu(false)
      const newCursor = start + offset
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (el) {
          el.focus()
          el.setSelectionRange(newCursor, newCursor)
        }
        adjustHeight()
      })
    },
    [lastSlashIndex, cursorPosition, text, adjustHeight],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      const uploadsPending = !isEmpty(files) && files.every((f) => f.progress < 100);
      if (
        !loading &&
        !typing &&
        !uploadsPending &&
        (text.trim() || files.length > 0)
      ) {
        handleSend();
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() || files.length > 0) {
        handleSend();
      }
    }
  };

  const handleRemoveFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      handleDeleteFile(file);
    }
  }, [files, handleDeleteFile]);

  useLayoutEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  const uploadsPending =
    !isEmpty(files) && files.every((f) => f.progress < 100);
  const hasSendableContent = Boolean(text.trim()) || files.length > 0;
  const sendDisabled =
    typing ||
    loading ||
    uploadsPending ||
    !hasSendableContent;
  const showSendControl = !typing && (hasSendableContent || loading);

  /** URL /chat/:id/voice supplies id before memory SWR resolves — Live API needs this for context + saving. */
  const voiceMemoryId = memoryId ?? voiceRouteChatId ?? null;

  if (isVoiceMode) {
    return (
      <Voiceinput
        onCancel={() => {
          if (isVoiceCallRoute && voiceRouteChatId) {
            navigate(`/chat/${voiceRouteChatId}`, { replace: true });
          }
          setInlineVoiceOpen(false);
        }}
        memoryId={voiceMemoryId}
        history={history}
      />
    );
  }

  return (
    <div className={cn(wrapperClassName)} data-testid={shellTestId}>
      <div className="w-full min-w-0">
        <div
          ref={inputWrapperRef}
          data-testid="chat-composer-surface"
          className={
            cn(
              "flex min-h-24 w-full min-w-0 flex-col gap-2 rounded-xl border border-stroke-neutral-weak bg-background px-3 py-2.5 transition-[border-color,box-shadow] duration-150 focus-within:border-stroke-neutral-strong focus-within:shadow-sm sm:px-4 sm:py-3",
              className
            )
          }
        >
          {files.length > 0 && (
            <ImagePreview {...{ files, handleRemoveFile }} />
          )}
          {replyQuote?.text?.trim() ? (
            <div className="flex w-full min-w-0 items-start gap-2 rounded-xl border-l-[3px] border-stroke-brand-strong bg-fill-neutral-weaker px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-inter text-[11px] font-semibold uppercase tracking-wide text-text-neutral-weak">
                  Replying to{" "}
                  {replyQuote.role === "user" ? "your message" : "Memento"}
                </p>
                <p className="mt-0.5 line-clamp-3 font-inter text-sm text-text-neutral-strong">
                  {snippetReplyText(replyQuote.text)}
                </p>
              </div>
              {onClearReplyQuote ? (
                <button
                  type="button"
                  onClick={onClearReplyQuote}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-neutral-weak transition-colors hover:bg-fill-neutral-weaker hover:text-text-neutral-strong"
                  aria-label="Cancel reply"
                >
                  <TimesIcon className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => {
              setText(e.target.value)
              setCursorPosition(e.target.selectionStart)
            }}
            onSelect={() => setCursorPosition(textareaRef.current?.selectionStart ?? 0)}
            placeholder="Type text here... Type / for formatting"
            className={cn(
              "min-h-10 w-full shrink-0 resize-none overflow-hidden bg-transparent font-geist text-sm leading-5 text-text-neutral-strong outline-none placeholder:text-text-neutral-weaker sm:text-base sm:leading-6",
              {
                [inputClassName]: !isEmpty(inputClassName),
              },
            )}
            rows={1}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          <SlashCommandPopup
            show={showSlashMenu}
            position={slashPosition}
            commands={filteredSlashCommands}
            selectedIndex={clampedSlashIndex}
            onSelectedIndexChange={setSlashSelectedIndex}
            onCommandSelect={handleSlashCommandSelect}
            onClose={() => setShowSlashMenu(false)}
          />
          <div className="mt-auto flex justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* File Upload Button */}
              <label
                htmlFor="chat-file-trigger"
                aria-label="Attach file"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-fill-neutral-weaker text-icon-neutral-weak transition-[transform,background-color,color] duration-150 hover:bg-fill-neutral-weak hover:text-text-neutral-strong active:scale-[0.97]"
              >
                <Paperclip className="size-4" strokeWidth={1.75} aria-hidden />
                <input
                  id="chat-file-trigger"
                  type="file"
                  multiple
                  accept={SUPPORTED_FILE_TYPES.join(",")}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {shellTestId !== "chat-input-conversation-shell" && !typing ? (
                voiceCallTo ? (
                  <Link
                    to={voiceCallTo}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-stroke-neutral-weaker bg-fill-neutral-weaker text-icon-neutral-weak no-underline transition-colors hover:bg-fill-neutral-weak hover:text-text-neutral-strong md:size-11"
                    aria-label="Voice call"
                  >
                    <Phone
                      className="size-[18px] shrink-0 md:size-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInlineVoiceOpen(true)}
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-stroke-neutral-weaker bg-fill-neutral-weaker text-icon-neutral-weak transition-colors hover:bg-fill-neutral-weak hover:text-text-neutral-strong md:size-11"
                    aria-label="Voice call"
                  >
                    <Phone
                      className="size-[18px] shrink-0 md:size-5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>
                )
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!typing && !showSendControl ? (
                <button
                  type="button"
                  onClick={() => void toggleQuickRecording()}
                  className={cn(
                    "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-fill-neutral-weaker text-icon-neutral-weak transition-[transform,background-color,color] duration-150 hover:bg-fill-neutral-weak hover:text-text-neutral-strong active:scale-[0.97]",
                    isQuickRecording &&
                      "border-stroke-error-strong bg-fill-error-weak text-text-error-strong hover:bg-fill-error-weak",
                  )}
                  aria-label={isQuickRecording ? "Stop recording" : "Record voice clip"}
                >
                  <Mic
                    className="size-4 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              ) : null}
              {typing ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="btn text-white"
                >
                  Stop
                </button>
              ) : null}
              {showSendControl ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sendDisabled}
                  aria-label="Send"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-neutral-strong text-primary-foreground transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span>Sending..</span>
                      <Spinner loading className="!size-4" />
                    </>
                  ) : (
                    <><ArrowUp className="size-4" strokeWidth={2} aria-hidden /><span className="sr-only">Send</span></>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Chatinput(props: IChatinputProps) {
  return (
    <ChatinputImpl
      shellTestId="chat-input-landing-shell"
      wrapperClassName="mx-auto w-full min-w-0 max-w-[600px]"
      {...props}
    />
  );
}

export function ConversationChatinput(props: IChatinputProps) {
  return (
    <ChatinputImpl
      shellTestId="chat-input-conversation-shell"
      wrapperClassName="w-full min-w-0"
      {...props}
    />
  );
}
