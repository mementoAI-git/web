"use client";

import { useState, useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import type { IFile, IOnUploadPayload } from "@/utility/interface";
import { EditorToolbar } from "./editor-toolbar";
import { LinkInput } from "./link-input";
import { SlashCommandPopup } from "./slash-command-popup";
import { SLASH_COMMANDS } from "./slash-commands";
import { FilePreview } from "./file-preview";
import { useMemoryEditor } from "./use-memory-editor";

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
  const [editorStateVersion, setEditorStateVersion] = useState(0);

  const {
    editor,
    showLinkInput,
    setShowLinkInput,
    linkPosition,
    showSlashMenu,
    setShowSlashMenu,
    slashPosition,
    slashSelectedIndex,
    setSlashSelectedIndex,
    submitLink,
    selectSlashCommand,
  } = useMemoryEditor({
    initialContent: value || "",
    placeholder: "Type / to search for formatting options",
    editorClassName:
      "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px]",
    linkClassName: "text-blue-6 underline cursor-pointer",
    onHtmlChange: (html) => onChange?.({ target: { value: html, name } }),
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const bump = () => setEditorStateVersion((v) => v + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  const handleLinkSubmit = (text: string, url: string) => {
    submitLink(text, url);
  };

  const handleCommandSelect = (command: (typeof SLASH_COMMANDS)[0]) => {
    if (!editor) return;
    if (command.label === "Link") {
      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
      const lastSlashIndex = textBefore.lastIndexOf("/");
      if (lastSlashIndex === -1) return;
      const from = selection.from - (textBefore.length - lastSlashIndex);
      const to = selection.from;
      editor.chain().focus().deleteRange({ from, to }).run();
      setShowLinkInput(true);
      return;
    }
    selectSlashCommand(command);
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
          commands={SLASH_COMMANDS}
          selectedIndex={slashSelectedIndex}
          onSelectedIndexChange={setSlashSelectedIndex}
          onCommandSelect={handleCommandSelect}
          onClose={() => setShowSlashMenu(false)}
        />

        <LinkInput
          show={showLinkInput}
          position={linkPosition}
          onSubmit={handleLinkSubmit}
          onClose={() => setShowLinkInput(false)}
        />
      </div>

      <EditorToolbar editor={editor} editorStateVersion={editorStateVersion} />
    </div>
  );
}
