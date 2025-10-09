"use client"

import { useState, useRef, useEffect } from "react"
import useClickAway from "@/hooks/use-clickaway"

interface LinkInputProps {
  show: boolean
  position: { top: number; left: number }
  initialUrl?: string
  initialText?: string
  onSubmit: (text: string, url: string) => void
  onRemove?: () => void
  onClose: () => void
}

export function LinkInput({
  show,
  position,
  initialUrl = "",
  initialText = "",
  onSubmit,
  onRemove,
  onClose
}: LinkInputProps) {
  const [text, setText] = useState(initialText)
  const [url, setUrl] = useState(initialUrl)
  const textInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useClickAway(onClose)

  useEffect(() => {
    if (show) {
      setText(initialText)
      setUrl(initialUrl)
      // Focus text input after it appears
      setTimeout(() => textInputRef.current?.focus(), 0)
    }
  }, [show, initialUrl, initialText])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && url.trim()) {
      onSubmit(text.trim(), url.trim())
      onClose()
    }
  }

  const handleRemove = () => {
    onRemove?.()
    onClose()
  }

  if (!show) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50 rounded-xl bg-white p-3 shadow-lg border border-gray-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          ref={textInputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to display..."
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm min-w-[280px]"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL..."
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm min-w-[280px]"
        />
        <div className="flex gap-2 justify-end">
          {initialUrl && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-blue-6 text-white hover:bg-blue-3 rounded-lg transition-colors"
          >
            {initialUrl ? 'Update' : 'Insert'}
          </button>
        </div>
      </form>
    </div>
  )
}

