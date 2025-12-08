"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { BoldIcon, HeadingIcon, ItalicIcon, LinkIcon, OrderedListIcon, QuoteIcon, UnorderedListIcon } from "@/components/icons";
import { LinkInput } from "./link-input";

interface EditorToolbarProps {
  editor: Editor;
  editorStateVersion?: number;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export function EditorToolbar({ editor, editorStateVersion: _editorStateVersion }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });

  const handleLinkClick = () => {
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setLinkPosition({ top: coords.top - 100, left: coords.left });
    setShowLinkInput(true);
  };

  const handleLinkSubmit = (text: string, url: string) => {
    if (!editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: "text",
          marks: [{ type: "link", attrs: { href: url } }],
          text,
        })
        .insertContent(" ")
        .focus()
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          marks: [{ type: "link", attrs: { href: url } }],
          text,
        })
        .insertContent(" ")
        .focus()
        .run();
    }
  };

  const handleLinkRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, " ");
  const previousUrl = editor.getAttributes("link").href || "";

  return (
    <div className="flex min-h-8 items-center gap-1 border-t border-gray-200 bg-[#F9FAFB] px-3 py-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("bold") && "bg-gray-300",
        )}
        type="button"
      >
        <BoldIcon width={10} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("italic") && "bg-gray-300",
        )}
        type="button"
      >
        <ItalicIcon width={12} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("heading", { level: 1 }) && "bg-gray-300",
        )}
        type="button"
      >
        <HeadingIcon width={11} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("heading", { level: 2 }) && "bg-gray-300",
        )}
        type="button"
      >
        <HeadingIcon width={9} height={11} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("blockquote") && "bg-gray-300",
        )}
        type="button"
      >
        <QuoteIcon width={14} height={10} />
      </button>

      <button
        onClick={handleLinkClick}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("link") && "bg-gray-300",
        )}
        type="button"
      >
        <LinkIcon width={20} height={10} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("bulletList") && "bg-gray-300",
        )}
        type="button"
      >
        <UnorderedListIcon width={18} height={15} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200",
          editor.isActive("orderedList") && "bg-gray-300",
        )}
        type="button"
      >
        <OrderedListIcon width={19} height={16} />
      </button>

      <LinkInput
        show={showLinkInput}
        position={linkPosition}
        initialText={selectedText}
        initialUrl={previousUrl}
        onSubmit={handleLinkSubmit}
        onRemove={handleLinkRemove}
        onClose={() => setShowLinkInput(false)}
      />
    </div>
  );
}
