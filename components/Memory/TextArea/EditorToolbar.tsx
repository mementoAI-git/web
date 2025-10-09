"use client"

import { Editor } from '@tiptap/react'
import BoldIcon from "@/public/icon/editor/bold.svg"
import ItalicIcon from "@/public/icon/editor/italic.svg"
import HeadingIcon from "@/public/icon/editor/heading.svg"
import LinkIcon from "@/public/icon/editor/link.svg"
import ImageIcon from "@/public/icon/editor/image.svg"
import ListIcon from "@/public/icon/editor/unorderlist.svg"
import OrderListIcon from "@/public/icon/editor/orderlist.svg"
import QuoteIcon from "@/public/icon/editor/quote.svg"
import { useModal } from "@/hooks/use-modal"
import { useCallback } from "react"

interface EditorToolbarProps {
  editor: Editor
}

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ")

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const { open } = useModal()

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="flex min-h-8 px-3 py-1 items-center gap-1 bg-[#F9FAFB] border-t border-gray-200">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('bold') && "bg-gray-300"
        )}
        type="button"
      >
        <BoldIcon width={10} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('italic') && "bg-gray-300"
        )}
        type="button"
      >
        <ItalicIcon width={12} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('heading', { level: 2 }) && "bg-gray-300"
        )}
        type="button"
      >
        <HeadingIcon width={11} height={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('heading', { level: 3 }) && "bg-gray-300"
        )}
        type="button"
      >
        <HeadingIcon width={9} height={11} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('blockquote') && "bg-gray-300"
        )}
        type="button"
      >
        <QuoteIcon width={14} height={10} />
      </button>

      <button
        onClick={setLink}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('link') && "bg-gray-300"
        )}
        type="button"
      >
        <LinkIcon width={20} height={10} />
      </button>

      <button
        onClick={() => open("file-upload", null)}
        className="size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors"
        type="button"
      >
        <ImageIcon width={18} height={18} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('bulletList') && "bg-gray-300"
        )}
        type="button"
      >
        <ListIcon width={18} height={15} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "size-8 flex items-center cursor-pointer justify-center rounded hover:bg-gray-200 transition-colors",
          editor.isActive('orderedList') && "bg-gray-300"
        )}
        type="button"
      >
        <OrderListIcon width={19} height={16} />
      </button>
    </div>
  )
}

