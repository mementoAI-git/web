import { Editor, Range } from '@tiptap/core'
import BoldIcon from "@/public/icon/editor/bold.svg"
import ItalicIcon from "@/public/icon/editor/italic.svg"
import HeadingIcon from "@/public/icon/editor/heading.svg"
import LinkIcon from "@/public/icon/editor/link.svg"
import ImageIcon from "@/public/icon/editor/image.svg"
import ListIcon from "@/public/icon/editor/unorderlist.svg"
import OrderListIcon from "@/public/icon/editor/orderlist.svg"
import QuoteIcon from "@/public/icon/editor/quote.svg"

export interface CommandItem {
  icon: React.ReactElement
  command: ({ editor, range }: { editor: Editor; range: Range }) => void
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    icon: <HeadingIcon width={11} height={14} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run()
    },
  },
  {
    icon: <HeadingIcon width={9} height={11} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run()
    },
  },
  {
    icon: <BoldIcon width={10} height={14} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setMark('bold')
        .run()
    },
  },
  {
    icon: <ItalicIcon width={12} height={14} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setMark('italic')
        .run()
    },
  },
  {
    icon: <ListIcon width={18} height={15} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run()
    },
  },
  {
    icon: <OrderListIcon width={19} height={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleOrderedList()
        .run()
    },
  },
  {
    icon: <QuoteIcon width={14} height={10} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setBlockquote()
        .run()
    },
  }
]

