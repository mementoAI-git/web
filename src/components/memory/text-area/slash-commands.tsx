import type { Editor, Range } from "@tiptap/core";
import type { ReactElement } from "react";
import { BoldIcon, HeadingIcon, ItalicIcon, LinkIcon, OrderedListIcon, QuoteIcon, UnorderedListIcon } from "@/components/icons";

export interface CommandItem {
  icon: ReactElement;
  label: string;
  shortcut?: string;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    icon: <HeadingIcon width={11} height={14} />,
    label: "Heading 1",
    shortcut: "#",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    icon: <HeadingIcon width={9} height={11} />,
    label: "Heading 2",
    shortcut: "##",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    icon: <BoldIcon width={10} height={14} />,
    label: "Bold",
    shortcut: "**",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark("bold").run();
    },
  },
  {
    icon: <ItalicIcon width={12} height={14} />,
    label: "Italic",
    shortcut: "*",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark("italic").run();
    },
  },
  {
    icon: <span className="underline text-sm font-bold leading-none">U</span>,
    label: "Underline",
    shortcut: "_",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleUnderline().run();
    },
  },
  {
    icon: <UnorderedListIcon width={18} height={15} />,
    label: "Bulleted list",
    shortcut: "-",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    icon: <OrderedListIcon width={19} height={16} />,
    label: "Numbered list",
    shortcut: "1.",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    icon: <QuoteIcon width={14} height={10} />,
    label: "Quote",
    shortcut: ">",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    icon: <LinkIcon width={14} height={9} />,
    label: "Link",
    shortcut: "⌘K",
    command: ({ editor }) => {
      editor.chain().focus().run();
    },
  },
];
