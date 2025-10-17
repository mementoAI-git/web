"use client"

import { IFile, IOnUploadPayload } from "@/utility/interface"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from "react"
import { SLASH_COMMANDS } from './slash-commands'
import { EditorToolbar } from './EditorToolbar'
import { SlashCommandPopup } from './SlashCommandPopup'
import { FilePreview } from "./FilePreview"

interface ITextArea {
  attachments?: IFile[]
  files?: IOnUploadPayload[]
  value?: string
  name?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
  onRemoveAttachment?: (fileId: string) => void
  isUploading?: boolean
}

export function TextArea({ attachments = [], files = [], value, name, onChange }: ITextArea) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: 'Tap to start typing... (Type / for formatting)',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-6 underline cursor-pointer',
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
    <div className="flex min-h-[374px] flex-col border border-gray-200 rounded-2xl bg-white font-inter text-xs overflow-hidden relative">
      <FilePreview files={files} attachments={attachments} />

      <div className="relative flex-1 mt-3">
        <EditorContent
          editor={editor}
          className="size-full max-h-[460px] overflow-y-auto flex-1 text-base px-3 tiptap-editor"
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