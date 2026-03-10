import type { ReactElement } from "react";
import {
  BoldIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  UnorderedListIcon,
} from "@/components/icons";

export interface ChatSlashCommandItem {
  icon: ReactElement;
  label: string;
  shortcut?: string;
  /** Plain text to insert at cursor (replacing "/" and query). */
  textToInsert: string;
  /** If set, cursor is placed this many chars into the insertion (e.g. 2 for "****" → cursor between **). */
  cursorOffsetAfterInsert?: number;
}

export const CHAT_SLASH_COMMANDS: ChatSlashCommandItem[] = [
  {
    icon: <HeadingIcon width={11} height={14} />,
    label: "Heading 1",
    shortcut: "#",
    textToInsert: "# ",
  },
  {
    icon: <HeadingIcon width={9} height={11} />,
    label: "Heading 2",
    shortcut: "##",
    textToInsert: "## ",
  },
  {
    icon: <BoldIcon width={10} height={14} />,
    label: "Bold",
    shortcut: "**",
    textToInsert: "****",
    cursorOffsetAfterInsert: 2,
  },
  {
    icon: <ItalicIcon width={12} height={14} />,
    label: "Italic",
    shortcut: "*",
    textToInsert: "**",
    cursorOffsetAfterInsert: 1,
  },
  {
    icon: <span className="underline text-sm font-bold leading-none">U</span>,
    label: "Underline",
    shortcut: "_",
    textToInsert: "__",
    cursorOffsetAfterInsert: 1,
  },
  {
    icon: <UnorderedListIcon width={18} height={15} />,
    label: "Bulleted list",
    shortcut: "-",
    textToInsert: "- ",
  },
  {
    icon: <OrderedListIcon width={19} height={16} />,
    label: "Numbered list",
    shortcut: "1.",
    textToInsert: "1. ",
  },
  {
    icon: <QuoteIcon width={14} height={10} />,
    label: "Quote",
    shortcut: ">",
    textToInsert: "> ",
  },
  {
    icon: <LinkIcon width={14} height={9} />,
    label: "Link",
    shortcut: "⌘K",
    textToInsert: "[]()",
    cursorOffsetAfterInsert: 1,
  },
];
