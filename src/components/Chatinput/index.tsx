import { AudioAttachmentRecorder } from "@/components/recorder/voice-recorder";
import { ChatDesignIcon } from "@/components/chat-design-icon";
import { useVoiceSession } from "@/contexts/voice-session";
import { buildPromptWithReplyQuote } from "@/utility/chat-reply-prompt";
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
  useRef,
  useState,
} from "react";
import { InlineVoiceSession } from "./inline-voice-session";
import Spinner from "../spinner";
import useFileUpload from "@/hooks/use-file-upload";
import { type IFile, type IOnUploadPayload } from "@/utility/interface";
import { v4 as uuidv4 } from "uuid";
import ImagePreview from "./ImagePreveiw";
import { isEmpty } from "lodash";
import { SUPPORTED_FILE_TYPES, inferMimeType, isSupportedFileMime } from "@/utility/constant";
import { ArrowUp, Square } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export interface IOnSendPayload {
  attachments?: IFile[];
  text: string;
  /** Quoted message context (embedded in the prompt on send). */
  replyTo?: ChatReplyQuote | null;
}

export type { ChatReplyQuote };

export interface IChatinputProps {
  connectionPersonId?: string;
  voiceEnabled?: boolean;
  placeholder?: string;
  className?: string
  inputClassName?: string
  topic?: boolean
  typing?: boolean
  loading?: boolean
  onChangeText?: (str: string) => void;
  onSend?: (p: IOnSendPayload) => void
  onVoiceSessionChange?: (active: boolean) => void;
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
  connectionPersonId,
  voiceEnabled = true,
  placeholder = "Type text here...",
  shellTestId,
  className = "",
  inputClassName = "",
  topic = false,
  typing = false,
  loading = false,
  onStop,
  onVoiceSessionChange,
  onSend,
  memoryId,
  history = [],
  draftStorageKey = null,
  replyQuote = null,
  onClearReplyQuote,
}: ChatinputImplProps) {
  const location = useLocation();
  const voice = useVoiceSession();
  const [voiceSending, setVoiceSending] = useState(false);
  const navigate = useNavigate();
  const voiceRouteMatch = location.pathname.match(/^\/chat\/([^/]+)\/voice\/?$/);
  const voiceRouteChatId = voiceRouteMatch?.[1] ?? null;
  const isVoiceCallRoute = Boolean(voiceRouteChatId);
  const pathChatId = location.pathname.match(/^\/chat\/([^/]+)\/?$/)?.[1];
  const voiceNavTargetId = memoryId ?? pathChatId ?? null;
  const voiceCallTo =
    voiceNavTargetId ? `/chat/${voiceNavTargetId}?voice=1` : null;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  /** Prevents double-applying `?starter=` when layout re-runs before navigation replaces the URL. */
  const starterAppliedPathKeyRef = useRef<string | null>(null)

  const [isQuickRecording, setIsQuickRecording] = useState(false)

  const { files, handleUpload, setFiles, handleDeleteFile } = useFileUpload();

  const isVoiceMode = isVoiceCallRoute || new URLSearchParams(location.search).get("voice") === "1" || inlineVoiceOpen;

  useEffect(() => {
    if (!voice || !isVoiceMode || !voiceEnabled) return;
    voice.start({ connectionPersonId, memoryId: voiceNavTargetId === "new" ? null : voiceNavTargetId, history });
    const params = new URLSearchParams(location.search);
    params.delete("voice");
    navigate(`${isVoiceCallRoute ? `/chat/${voiceRouteChatId}` : location.pathname}${params.size ? `?${params}` : ""}`, { replace: true });
    setInlineVoiceOpen(false);
  }, [voice, voiceEnabled, connectionPersonId, isVoiceMode, voiceNavTargetId, history, location.pathname, location.search, navigate, isVoiceCallRoute, voiceRouteChatId]);

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

  const handleSend = async () => {
    if (voiceSending || loading || typing) return;
    if (files.some((file) => !file.uploadedFile?._id)) {
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
    if (voice?.active && voice.connectionPersonId === connectionPersonId) {
      setVoiceSending(true);
      try {
        await voice.send({ text: buildPromptWithReplyQuote(text, replyQuote ?? null), attachments });
        onClearReplyQuote?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not send to voice. Please try again.");
        return;
      } finally {
        setVoiceSending(false);
      }
    } else onSend?.(payload);
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      const uploadsPending = files.some((file) => !file.uploadedFile?._id);
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
    files.some((file) => !file.uploadedFile?._id);
  const hasSendableContent = Boolean(text.trim()) || files.length > 0;
  const sendDisabled =
    typing ||
    loading ||
    uploadsPending ||
    voiceSending ||
    Boolean(voice?.active && voice.connectionPersonId === connectionPersonId && !voice.ready) ||
    !hasSendableContent;
  const showSendControl = !typing && (hasSendableContent || loading);

  /** URL /chat/:id/voice supplies id before memory SWR resolves — Live API needs this for context + saving. */
  const voiceMemoryId = memoryId ?? (voiceRouteChatId === "new" ? null : voiceRouteChatId);

  if (isVoiceMode && !voice && voiceEnabled) {
    return (
      <InlineVoiceSession
        connectionPersonId={connectionPersonId}
        onSessionChange={onVoiceSessionChange}
        onEnd={() => {
          const params = new URLSearchParams(location.search);
          params.delete("voice");
          const path = isVoiceCallRoute ? `/chat/${voiceRouteChatId}` : location.pathname;
          navigate(`${path}${params.size ? `?${params}` : ""}`, { replace: true });
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
          onClick={(event) => {
            // Keep toolbar actions and native textarea caret placement intact.
            if ((event.target as Element).closest('button, a, input, textarea, select, label, [role="button"], [role="menuitem"], [contenteditable="true"]')) return;
            textareaRef.current?.focus();
          }}
          className={
            cn(
              "sky-card chat-composer-surface flex min-h-[140px] w-full min-w-0 cursor-text flex-col gap-4 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak p-4 transition-[border-color,box-shadow] duration-150 focus-within:border-stroke-neutral-strong focus-within:shadow-sm sm:p-5",
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
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            aria-label={connectionPersonId ? placeholder : undefined}
            className={cn(
              "min-h-12 w-full shrink-0 resize-none overflow-hidden bg-transparent font-geist text-sm leading-5 text-text-neutral-strong outline-none placeholder:text-text-neutral-weaker sm:text-base sm:leading-6",
              {
                [inputClassName]: !isEmpty(inputClassName),
              },
            )}
            rows={1}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
          {isQuickRecording ? (
            <AudioAttachmentRecorder
              className="mb-0"
              onFinish={(file) => void processFileForUpload(file)}
              onClose={() => setIsQuickRecording(false)}
            />
          ) : null}
          <div className="mt-auto flex justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* File Upload Button */}
              <label
                htmlFor="chat-file-trigger"
                aria-label="Attach file"
                className="flex size-9 md:size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak text-icon-neutral-strong transition-[transform,background-color,color] duration-150 hover:bg-fill-neutral-weak hover:text-text-neutral-strong active:scale-[0.97]"
              >
                <ChatDesignIcon name={topic ? "plus" : "attachment"} />
                <input
                  id="chat-file-trigger"
                  type="file"
                  multiple
                  accept={SUPPORTED_FILE_TYPES.join(",")}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>


            </div>

            <div className={cn("flex shrink-0 items-center", topic ? "gap-1" : "gap-2")}>
              {!typing && (!showSendControl || topic) ? (
                <button
                  type="button"
                  disabled={isQuickRecording}
                  onClick={() => setIsQuickRecording(true)}
                  className={cn(
                    "flex size-9 md:size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak text-icon-neutral-strong transition-[transform,background-color,color] duration-150 hover:bg-fill-neutral-weak hover:text-text-neutral-strong active:scale-[0.97]",
                    topic && "bg-transparent",
                  )}
                  aria-label="Record voice clip"
                >
                  <ChatDesignIcon name="microphone" />
                </button>
              ) : null}
              {voiceEnabled && !topic && !typing && !showSendControl && !isQuickRecording ? (
                <button
                  type="button"
                  aria-label="Voice call"
                  aria-pressed={Boolean(voice?.active)}
                  disabled={Boolean(voice?.active)}
                  onClick={() => {
                    if (voice) voice.start({ connectionPersonId, memoryId: voiceNavTargetId === "new" ? null : voiceNavTargetId ?? memoryId, history });
                    else if (voiceCallTo) navigate(voiceCallTo);
                    else setInlineVoiceOpen(true);
                  }}
                  className="flex size-9 md:size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-overview-voice text-overview-voice transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:cursor-default disabled:opacity-50"
                >
                  <ChatDesignIcon name="phone" />
                </button>
              ) : null}
              {typing ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fill-chat-send text-icon-chat-send md:size-10"
                >
                  <Square className="size-4" fill="currentColor" aria-hidden />
                </button>
              ) : null}
              {showSendControl || topic ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sendDisabled || (topic && !showSendControl)}
                  aria-label="Send"
                  className="flex size-9 md:size-10 shrink-0 items-center justify-center rounded-full bg-fill-chat-send text-icon-chat-send transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="sr-only">Sending...</span>
                      <Spinner loading className="!size-4" />
                    </>
                  ) : (
                    <>{topic ? <ChatDesignIcon name="send" /> : <ArrowUp className="size-4" strokeWidth={2} aria-hidden />}<span className="sr-only">Send</span></>
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
