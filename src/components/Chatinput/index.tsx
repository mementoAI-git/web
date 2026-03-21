import { GearIcon, PlusIcon, WaveIcon } from "@/components/icons";
import { cn, toBase64 } from "@/utility";
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
import ChatSettings from "../modal/chat-settings";
import { SUPPORTED_FILE_TYPES, inferMimeType } from "@/utility/constant";
import { getTextareaCaretCoordinates } from "@/utility/textarea-caret";
import { SlashCommandPopup } from "@/components/memory/text-area/slash-command-popup";
import {
  CHAT_SLASH_COMMANDS,
  type ChatSlashCommandItem,
} from "./chat-slash-commands";

export interface IOnSendPayload {
  attachments?: IFile[];
  text: string
}

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
}: ChatinputImplProps) {
  const [text, setText] = useState("")
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)

  const { files, handleUpload, setFiles, handleDeleteFile } = useFileUpload();

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
      if (!(SUPPORTED_FILE_TYPES as readonly string[]).includes(resolvedType)) {
        alert(
          "Please select a supported file type (images, PDF, video, or audio)",
        );
        return;
      }

      const maxSize = resolvedType.startsWith("video/")
        ? 15 * 1024 * 1024
        : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type.startsWith("video/") ? 15 : 5;
        alert(`File size must be less than ${maxSizeMB}MB`);
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
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await processFileForUpload(file);
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

  const handleSend = () => {
    if (!isEmpty(files) && files.every(f => f.progress < 100)) {
      return;
    }

    const attachments = files
      .filter(f => f.uploadedFile)
      .map(f => f.uploadedFile);

    const payload = { text, attachments };
    onSend?.(payload);
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

  if (isVoiceMode) {
    return (
      <Voiceinput
        onCancel={() => setIsVoiceMode(false)}
        {...{ memoryId, history }}
      />
    );
  }

  return (
    <div className={cn(wrapperClassName)} data-testid={shellTestId}>
      <div className="w-full min-w-0 rounded-[30px] bg-[rgba(251,248,244,0.7)] p-[6px]">
        <div
          ref={inputWrapperRef}
          className={
            cn(
              "flex min-h-[120px] w-full min-w-0 flex-col gap-3 rounded-3xl border border-[rgba(0,0,0,0.05)] px-4 py-3 shadow-[0px_4px_8px_0px_#AB7E2B1C] focus-within:border-orange/16 !bg-white md:gap-4 md:p-6",
              className
            )
          }
          style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
        >
          {files.length > 0 && (
            <ImagePreview {...{ files, handleRemoveFile }} />
          )}
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
              "min-h-10 md:min-h-12 w-full shrink-0 outline-none font-georgia resize-none text-lg md:text-xl overflow-hidden",
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
          <div className="flex justify-between">
            <div className="flex items-center gap-4">
              {/* File Upload Button */}
              <label htmlFor="chat-file-trigger" className="icon-container !size-8 md:!size-11 cursor-pointer !bg-gray-100 !text-gray-500 hover:!bg-gray-200">
                <PlusIcon className="size-3 md:size-5" />
                <input
                  id="chat-file-trigger"
                  type="file"
                  accept={SUPPORTED_FILE_TYPES.join(",")}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <ChatSettings>
                <div className={cn("icon-container", "!rounded-xl !size-8 md:!size-11 !bg-gray-100 !text-gray-500 hover:!bg-gray-200")}>
                  <GearIcon className="size-4 md:size-5 stroke-2" />
                </div>
              </ChatSettings>
            </div>

            {
              typing ?
                <button onClick={onStop} className="btn text-white">Stop</button> :
                (text.length > 0 || files.length > 0 || loading) ?
                  <button
                    onClick={handleSend}
                    disabled={loading || typing || (!isEmpty(files) && files.every(f => f.progress < 100))}
                    className="btn space-x-2 disabled:opacity-60 text-white"
                  >
                    {
                      loading ?
                        <>
                          <span>Sending..</span>
                          <Spinner loading className="!size-4" />
                        </> :
                        "Send"
                    }
                  </button> :
                  <button
                    onClick={() => setIsVoiceMode(true)}
                    className="sm:bg-orange/10 cursor-pointer bg-transparent flex items-center gap-2 rounded-full px-5 py-2.5 text-orange"
                  >
                    <WaveIcon className="size-5 stroke-2" />
                    <span className="font-inter hidden sm:inline text-sm font-semibold">
                      Use voice mode
                    </span>
                  </button>
            }
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
