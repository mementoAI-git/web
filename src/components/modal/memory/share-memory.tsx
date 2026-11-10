"use client";

import { useId } from "react";
import { CircleCheckIcon, CopyIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  FormDialog,
  FormDialogField,
  FormDialogFooter,
  FormDialogInput,
} from "@/components/modal/form-dialog";
import { useModal } from "@/hooks/use-modal";
import useCopy from "@/hooks/use-copy";
import { getSocialShareLinks } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { usePublicShareGate } from "@/features/sharing/use-public-share-gate";
import { ShareStoryAudience } from "./share-story-audience";
import facebook from "@/assets/image/Facebook.png";
import twitter from "@/assets/image/twitter.png";
import instagram from "@/assets/image/instagram.png";
import linkedin from "@/assets/image/linkedin.png";

interface ShareMemoryProps {
  data: {
    memory: IMemory;
  };
}

export default function ShareMemory({ data }: ShareMemoryProps) {
  const { memory } = data;
  const { close } = useModal();
  const [copied, handleCopy] = useCopy();
  const linkFieldId = useId();
  const isConversation = memory?.type === "conversation";

  const handleClose = () => close?.("share-memory");

  const link = memory?._id
    ? `${window.location.origin}/${isConversation ? "chat" : "post"}/${memory._id}`
    : "";

  // A story link only opens for others once the story is public, so stories
  // go through the gate; conversation links are for the owner alone.
  const gate = usePublicShareGate(isConversation ? "" : memory?._id ?? "", {
    initial: isConversation ? undefined : memory,
    onCopy: handleCopy,
  });
  const copyLink = isConversation ? handleCopy : gate.copy;

  const socialPlatforms = getSocialShareLinks({
    shareUrl: link,
    shareText: memory?.title ?? "Check out this story",
    onCopy: copyLink,
    onOpen: isConversation ? undefined : gate.open,
    images: { facebook, linkedin, twitter, instagram },
  });

  return (
    <FormDialog
      title={isConversation ? "Share this conversation" : "Share this Story"}
      description={
        isConversation
          ? "Copy a link to this conversation or share it on social media."
          : "Copy a link to this story or share it on social media."
      }
      onClose={handleClose}
    >
      <div className="flex flex-col gap-5">
        {memory?._id && !isConversation ? (
          <ShareStoryAudience memoryId={memory._id} />
        ) : null}
        <FormDialogField label="Share link" htmlFor={linkFieldId}>
          <div className="relative">
            <FormDialogInput
              id={linkFieldId}
              readOnly
              value={link}
              title={link}
              className="truncate pr-28"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              aria-label={copied ? "Link copied" : "Copy share link"}
              className="absolute inset-y-1.5 right-1.5 h-auto gap-1 rounded-md border-l border-stroke-neutral-weak px-3 text-sm font-medium text-text-brand-strong hover:text-text-brand-strong"
              onClick={() => copyLink(link, "Link copied successfully")}
            >
              {copied ? <CircleCheckIcon width={16} /> : <CopyIcon width={16} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </FormDialogField>

        <div className="flex items-center gap-3 text-xs text-text-neutral-weak">
          <span className="h-px flex-1 bg-stroke-neutral-weak" />
          Or share on social media
          <span className="h-px flex-1 bg-stroke-neutral-weak" />
        </div>

        <div className="flex items-center justify-between gap-3">
          {socialPlatforms.map((platform) => (
            <Button
              key={platform.name}
              type="button"
              variant="outline"
              aria-label={`Share on ${platform.name}`}
              className="size-14 shrink-0 rounded-full border-stroke-neutral-weak bg-transparent p-0"
              onClick={platform.onClick}
            >
              <img className="size-7 object-contain" src={platform.img} alt="" aria-hidden />
            </Button>
          ))}
        </div>

        {gate.dialog}

        <FormDialogFooter
          submitLabel={copied ? "Copied" : "Copy link"}
          busyLabel="Copying…"
          onDismiss={handleClose}
          onSubmit={() => copyLink(link, "Link copied successfully")}
        />
      </div>
    </FormDialog>
  );
}
