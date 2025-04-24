import { useCallback, useState } from "react";
import { toast } from "sonner";

type TUseCopy = [
  boolean,
  (t: string, m?: string) => void
]

export default function useCopy(): TUseCopy {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((text: string, message?: string) => {
    if (text.length === 0) return
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success(message || "Copied successfully")
      })
      .catch(console.error)
  }, [])

  return [copied, handleCopy]
}