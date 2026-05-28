"use client";

import { useState } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import type { CommandItem } from "./slash-commands";

interface UseMemoryEditorParams {
  initialContent?: string;
  placeholder: string;
  editorClassName: string;
  linkClassName: string;
  onHtmlChange: (html: string) => void;
  onTextChange?: (text: string) => void;
}

export function useMemoryEditor({
  initialContent = "",
  placeholder,
  editorClassName,
  linkClassName,
  onHtmlChange,
  onTextChange,
}: UseMemoryEditorParams) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: linkClassName,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
    onUpdate: ({ editor }) => {
      onHtmlChange(editor.getHTML());
      onTextChange?.(editor.getText());

      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset);
      const lastSlashIndex = textBefore.lastIndexOf("/");

      if (lastSlashIndex === -1) {
        setShowSlashMenu(false);
      } else {
        const query = textBefore.slice(lastSlashIndex + 1);
        if (query.includes(" ") || query.includes("\n")) {
          setShowSlashMenu(false);
        } else {
          const coords = editor.view.coordsAtPos(selection.from);
          setSlashPosition({ top: coords.top + 20, left: coords.left });
          setShowSlashMenu(true);
          setSlashSelectedIndex(0);
        }
      }
    },
  });

  const openLinkInputAtSelection = () => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setLinkPosition({ top: coords.top - 100, left: coords.left });
    setShowLinkInput(true);
  };

  const submitLink = (linkText: string, url: string) => {
    if (!editor) return;
    if (!editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text: linkText })
        .insertContent(" ")
        .focus()
        .run();
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({ type: "text", marks: [{ type: "link", attrs: { href: url } }], text: linkText })
      .insertContent(" ")
      .focus()
      .run();
  };

  const selectSlashCommand = (command: CommandItem) => {
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

  return {
    editor,
    showLinkInput,
    setShowLinkInput,
    linkPosition,
    showSlashMenu,
    setShowSlashMenu,
    slashPosition,
    slashSelectedIndex,
    setSlashSelectedIndex,
    openLinkInputAtSelection,
    submitLink,
    selectSlashCommand,
  };
}
