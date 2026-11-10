import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import endpoint from "@/api/endpoint";
import { putFetcher } from "@/api/fetcher";
import type { IResponse } from "@/api/interface";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { IMemory } from "@/utility/interface";

const SHARE_POPUP_WIDTH = 600;
const SHARE_POPUP_HEIGHT = 600;
const PUBLIC_AUDIENCE = { visibility: "everyone", groups: [], beneficiaries: [] };
const DRAFT_MESSAGE =
  "Publish this story before sharing it. Until then, only you can open its link.";

type Pending = { kind: "copy"; text: string; message: string } | { kind: "open"; url: string };

function popupFeatures() {
  const left = Math.round((window.screen.width - SHARE_POPUP_WIDTH) / 2);
  const top = Math.round((window.screen.height - SHARE_POPUP_HEIGHT) / 2);
  return `width=${SHARE_POPUP_WIDTH},height=${SHARE_POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes`;
}

/**
 * Gates copying or sending a story's link. The API only opens a link for a
 * saved story visible to everyone, and stories start private, so a private
 * story is made public first, once the owner confirms. A draft is refused.
 *
 * Browsers only let a click write the clipboard or open a window, so on
 * confirm both start inside the click; the window waits on a blank page and
 * is sent to the share page only after the story is public.
 */
export function usePublicShareGate(
  memoryId: string,
  options: {
    /** The story as the caller already has it, used until the fresh copy loads. */
    initial?: IMemory;
    /** How to copy when no confirmation is needed, e.g. to show "Copied". */
    onCopy?: (text: string, message: string) => void;
  } = {},
): {
  /** False until the story has loaded; nothing can be shared before then. */
  ready: boolean;
  copy: (text: string, message?: string) => void;
  open: (url: string) => void;
  dialog: ReactNode;
} {
  const key = `${endpoint.memories}/${memoryId}`;
  const { data } = useSWR<IResponse<IMemory>>(memoryId ? key : null);
  const memory = data?.data ?? options.initial;
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);

  const shareNow = (action: Pending) => {
    if (action.kind === "copy" && options.onCopy) {
      options.onCopy(action.text, action.message);
    } else if (action.kind === "copy") {
      navigator.clipboard
        .writeText(action.text)
        .then(() => toast.success(action.message))
        .catch(() => toast.error("We couldn’t copy the link. Try again."));
    } else {
      window.open(action.url, "share", popupFeatures());
    }
  };

  const request = (action: Pending) => {
    if (!memory) {
      toast.error("This story is still loading. Try again in a moment.");
      return;
    }
    if (memory.status === "draft") {
      toast.error(DRAFT_MESSAGE);
      return;
    }
    if (memory.visibility === "everyone") shareNow(action);
    else setPending(action);
  };

  const confirm = async () => {
    if (!pending) return;
    const action = pending;
    // Both must start inside this click, before any await.
    const copied = action.kind === "copy" ? navigator.clipboard.writeText(action.text) : null;
    const popup = action.kind === "open" ? window.open("", "share", popupFeatures()) : null;
    setSaving(true);
    try {
      const response = await putFetcher(key, { arg: PUBLIC_AUDIENCE });
      if (!response?.success) throw new Error(response?.message);
    } catch {
      // The request helper already told the owner what went wrong.
      popup?.close();
      setSaving(false);
      return;
    }
    // Lists, the open story and its audience picker all read these keys.
    await mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.startsWith(endpoint.memories));
    setSaving(false);
    setPending(null);
    if (action.kind === "copy") {
      try {
        await copied;
        toast.success(`Story is public. ${action.message}`);
      } catch {
        toast.error("The story is public, but we couldn’t copy the link. Copy it again.");
      }
    } else if (popup) {
      popup.opener = null;
      popup.location.href = action.url;
    } else {
      window.open(action.url, "share", popupFeatures());
    }
  };

  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && !saving && setPending(null)}>
      <AlertDialogContent className="z-[130]" overlayClassName="z-[125]">
        <AlertDialogHeader>
          <AlertDialogTitle>Make this story public?</AlertDialogTitle>
          <AlertDialogDescription>
            Anyone with the link will be able to read it. You can make it private again from Who can see this story.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Keep private</AlertDialogCancel>
          <Button disabled={saving} onClick={() => void confirm()}>
            {saving && <Spinner data-icon="inline-start" />}
            {pending?.kind === "open" ? "Make public and share" : "Make public and copy"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    ready: Boolean(memory),
    copy: (text, message = "Link copied") => request({ kind: "copy", text, message }),
    open: (url) => request({ kind: "open", url }),
    dialog,
  };
}
