import type { Editor, Range } from "@tiptap/core";
import type { ReactElement } from "react";
import { BoldIcon, HeadingIcon, ItalicIcon, OrderedListIcon, QuoteIcon, UnorderedListIcon } from "@/components/icons";

export interface CommandItem {
  icon: ReactElement;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    icon: <HeadingIcon width={11} height={14} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    icon: <HeadingIcon width={9} height={11} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    icon: <BoldIcon width={10} height={14} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark("bold").run();
    },
  },
  {
    icon: <ItalicIcon width={12} height={14} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setMark("italic").run();
    },
  },
  {
    icon: <UnorderedListIcon width={18} height={15} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    icon: <OrderedListIcon width={19} height={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    icon: <QuoteIcon width={14} height={10} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
];
