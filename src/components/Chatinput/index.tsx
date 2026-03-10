import { GearIcon, PlusIcon, WaveIcon } from "@/components/icons";
import { cn, toBase64 } from "@/utility";
import React, { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface IChatinputProps {
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

export default function Chatinput({
  className = "",
  inputClassName = "",
  typing = false,
  loading = false,
  onStop,
  onSend,
  memoryId,
  history = []
}: IChatinputProps) {
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

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 300); // Max height of 200px
      textarea.style.height = `${newHeight}px`;

      // Show scrollbar when content exceeds max height
      if (textarea.scrollHeight > 200) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resolvedType = file.type || inferMimeType(file.name);
    if (!(SUPPORTED_FILE_TYPES as readonly string[]).includes(resolvedType)) {
      alert('Please select a supported file type (images, PDF, video, or audio)');
      return;
    }

    const maxSize = resolvedType.startsWith('video/') ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = file.type.startsWith('video/') ? 15 : 5;
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    const base64 = await toBase64(file)

    const uploadPayload: IOnUploadPayload = {
      id: uuidv4(),
      file,
      progress: 0,
      base64
    };

    await handleUpload(uploadPayload);
  }, [handleUpload]);

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

    // Reset textarea height to original size
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.overflowY = 'hidden';
    }
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

  useEffect(() => {
    adjustHeight();
  }, []);

  if (isVoiceMode) {
    return (
      <Voiceinput
        onCancel={() => setIsVoiceMode(false)}
        {...{ memoryId, history }}
      />
    );
  }

  return (
    <div className="w-fit p-[6px] rounded-[30px] bg-[rgba(251,248,244,0.7)]">
      <div
        ref={inputWrapperRef}
        className={
          cn(
            "w-full h-fit flex focus-within:border-orange/16 flex-col gap-3 md:gap-4 rounded-3xl border border-[rgba(0,0,0,0.05)] py-3 px-4 md:p-6 !bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C] max-w-[600px] md:min-w-[600px]",
            className
          )
        }
        style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
      >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => {
          setText(e.target.value)
          setCursorPosition(e.target.selectionStart)
        }}
        onSelect={() => setCursorPosition(textareaRef.current?.selectionStart ?? 0)}
        placeholder="Type text here... Type / for formatting"
        className={cn("h-10 md:h-12 w-full outline-none font-georgia resize-none text-lg md:text-xl overflow-hidden", {
          [inputClassName]: !isEmpty(inputClassName)
        })}
        onInput={adjustHeight}
        rows={1}
        onKeyDown={handleKeyDown}
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
      <ImagePreview {...{ files, handleRemoveFile }} />
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
  )
}
