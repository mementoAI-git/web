"use client";

import { useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import type { IFile, IOnUploadPayload } from "@/utility/interface";
import { EditorToolbar } from "./editor-toolbar";
import { SlashCommandPopup } from "./slash-command-popup";
import { SLASH_COMMANDS } from "./slash-commands";
import { FilePreview } from "./file-preview";

interface TextAreaProps {
  attachments?: IFile[];
  files?: IOnUploadPayload[];
  value?: string;
  name?: string;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  onRemoveFile?: (fileId: string) => void;
  isUploading?: boolean;
}

export function TextArea({
  attachments = [],
  files = [],
  value,
  name,
  onChange,
  onRemoveAttachment,
  onRemoveFile,
}: TextAreaProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: "Tap to start typing... (Type / for formatting)",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-6 underline cursor-pointer",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.({ target: { value: html, name } });

      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);

      if (textBefore.endsWith("/")) {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashPosition({
          top: coords.top + 20,
          left: coords.left,
        });
        setShowSlashMenu(true);
      } else if (showSlashMenu) {
        const lastSlashIndex = textBefore.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          const query = textBefore.slice(lastSlashIndex + 1);
          if (query.includes(" ") || query.includes("\n")) {
            setShowSlashMenu(false);
          }
        }
      }
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const handleCommandSelect = (command: (typeof SLASH_COMMANDS)[0]) => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { $anchor } = selection;
    const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
    const lastSlashIndex = textBefore.lastIndexOf("/");

    if (lastSlashIndex !== -1) {
      const from = selection.from - (textBefore.length - lastSlashIndex);
      const to = selection.from;

      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .run();

      command.command({
        editor,
        range: { from, to },
      });
    }

    setShowSlashMenu(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="relative flex min-h-[374px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white font-inter text-xs">
      <FilePreview
        files={files}
        attachments={attachments}
        onRemoveFile={onRemoveFile}
        onRemoveAttachment={onRemoveAttachment}
      />

      <div className="relative mt-3 flex-1">
        <EditorContent
          editor={editor}
          className="tiptap-editor size-full max-h-[460px] flex-1 overflow-y-auto px-3 text-base"
        />

        <SlashCommandPopup
          show={showSlashMenu}
          position={slashPosition}
          onCommandSelect={handleCommandSelect}
          onClose={() => setShowSlashMenu(false)}
        />
      </div>

      <EditorToolbar editor={editor} />
    </div>
  );
}
