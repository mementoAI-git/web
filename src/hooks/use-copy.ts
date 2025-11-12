import { useCallback, useState } from "react";
import { toast } from "sonner";

type UseCopyReturn = [boolean, (text: string, message?: string) => void];

export default function useCopy(): UseCopyReturn {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text: string, message?: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(message ?? "Copied successfully");
      })
      .catch(console.error);
  }, []);

  return [copied, handleCopy];
}
