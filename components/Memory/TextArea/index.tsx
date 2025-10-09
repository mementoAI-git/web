"use client"

import { isEmpty } from "@/utility"
import { IFile } from "@/utility/interface"
import ImageThumbnail from "../../ImageThumbnail"
import { useModal } from "@/hooks/use-modal"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from "react"
import { SLASH_COMMANDS } from './slash-commands'
import { EditorToolbar } from './EditorToolbar'
import { SlashCommandPopup } from './SlashCommandPopup'

interface ITextArea {
  attachments?: IFile[]
  value?: string
  name?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
}

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ")

export function TextArea({ attachments = [], value, name, onChange }: ITextArea) {
  const { open } = useModal()
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Tap to start typing... (Type / for formatting)',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.({ target: { value: html, name } })

      // Check for slash command trigger
      const { state } = editor
      const { selection } = state
      const { $anchor } = selection
      const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset)

      if (textBefore.endsWith('/')) {
        // Get cursor position
        const coords = editor.view.coordsAtPos(selection.from)
        setSlashPosition({
          top: coords.top + 20,
          left: coords.left
        })
        setShowSlashMenu(true)
      } else if (showSlashMenu) {
        const lastSlashIndex = textBefore.lastIndexOf('/')
        if (lastSlashIndex !== -1) {
          const query = textBefore.slice(lastSlashIndex + 1)
          if (query.includes(' ') || query.includes('\n')) {
            setShowSlashMenu(false)
          }
        }
      }
    },
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  // Handle command selection
  const handleCommandSelect = (command: typeof SLASH_COMMANDS[0]) => {
    if (!editor) return

    const { state } = editor
    const { selection } = state
    const { $anchor } = selection
    const textBefore = $anchor.parent.textContent.slice(0, $anchor.parentOffset)
    const lastSlashIndex = textBefore.lastIndexOf('/')

    if (lastSlashIndex !== -1) {
      const from = selection.from - (textBefore.length - lastSlashIndex)
      const to = selection.from

      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .run()

      command.command({
        editor,
        range: { from, to }
      })
    }

    setShowSlashMenu(false)
  }

  if (!editor) {
    return null
  }

  return (
    <div className="flex min-h-[374px] flex-col gap-6 border border-gray-200 rounded-2xl bg-white font-inter text-xs overflow-hidden relative">
      {!isEmpty(attachments) && (
        <div onClick={() => open("file-preview", attachments)} className="relative size-fit p-3">
          <ImageThumbnail
            boxClassName="!rounded-[12px] !border-2"
            images={attachments}
            size={69}
          />
          {attachments.length > 3 && (
            <div className="absolute top-0 -right-10 z-40 rounded-full border border-white bg-secondary px-1.5 py-0.5 font-inter text-xs font-light text-[#C1FDC5]">
              +{attachments.length - 3} files
            </div>
          )}
        </div>
      )}

      <div className="relative flex-1">
        <EditorContent
          editor={editor}
          className="size-full flex-1 text-base p-3 tiptap-editor"
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
  )
}