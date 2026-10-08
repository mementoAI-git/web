"use client";

import { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { CircleCheckIcon, CopyIcon, PlusIcon } from "@/components/icons";
import { ModalCloseBtn } from "./modalLayout";
import { useModal } from "@/hooks/use-modal";
import useCopy from "@/hooks/use-copy";
import { getSocialShareLinks } from "@/utility";
import confetti from "@/assets/image/confetti.png";
import facebook from "@/assets/image/Facebook.png";
import twitter from "@/assets/image/twitter.png";
import instagram from "@/assets/image/instagram.png";
import linkedin from "@/assets/image/linkedin.png";

interface SharePostProps {
  data: { id: string; kind?: "conversation" };
  isMobile?: boolean;
}

/** Match delete-prompt-modal secondary / primary control sizing. */
const cancelClass =
  "h-10 cursor-pointer rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak px-4 py-2.5 font-inter text-sm font-semibold text-text-neutral-strong shadow transition-colors hover:bg-fill-neutral-weaker";

const primaryClass =
  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-fill-brand-strong px-4 py-2.5 font-inter text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90";

function SharePostContent({ data }: SharePostProps) {
  const { close, open } = useModal();
  const [copied, handleCopy] = useCopy();
  const [link, setLink] = useState<string>("");

  useEffect(() => {
    setLink(`${window.location.origin}/post/${data.id}`);
  }, [data.id]);

  const socialPlatforms = getSocialShareLinks({
    shareUrl: link,
    shareText:
      data.kind === "conversation"
        ? "Check out this conversation"
        : "Check out this story",
    onCopy: handleCopy,
    images: { facebook, linkedin, twitter, instagram },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <img
            src={confetti}
            alt=""
            className="size-12 shrink-0 object-contain"
            aria-hidden
          />
          <div className="min-w-0 space-y-2">
            <h4 className="modal-title !text-text-neutral-strong">
              {data.kind === "conversation"
                ? "Share conversation"
                : "Story added successfully"}
            </h4>
            <p className="font-inter text-sm text-text-neutral-weak">
              {data.kind === "conversation"
                ? "Share a link to this conversation."
                : "You have added a new story to your Memento."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker/50 p-4 sm:p-5">
        <div>
          <span className="font-inter text-sm font-medium text-text-neutral-strong">
            Share link
          </span>
          <div className="relative mt-2 flex min-h-10 items-stretch gap-0 overflow-hidden rounded-xl border border-stroke-neutral-weak bg-bg-neutral">
            <span className="min-w-0 flex-1 truncate px-3 py-2.5 font-inter text-sm text-text-neutral-strong">
              {link}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(link, "Link copied successfully")}
              className="shrink-0 border-l border-stroke-neutral-weak px-3 font-inter text-sm font-semibold text-text-brand-strong transition-colors hover:bg-fill-neutral-weaker"
            >
              <span className="flex items-center justify-center gap-1.5 py-2">
                {copied ? (
                  <>
                    <CircleCheckIcon width={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon width={16} />
                    Copy
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-stroke-neutral-weak" />
          <span className="shrink-0 font-inter text-xs text-text-neutral-weaker">
            Or share on social
          </span>
          <div className="h-px flex-1 bg-stroke-neutral-weak" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between sm:gap-4">
          {socialPlatforms.map((platform) => (
            <button
              key={platform.name}
              type="button"
              onClick={platform.onClick}
              className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-stroke-neutral-weak bg-bg-neutral transition-colors hover:border-stroke-neutral-strong hover:bg-fill-neutral-weaker"
              aria-label={`Share on ${platform.name}`}
            >
              <img
                className="size-7 object-contain"
                src={platform.img}
                alt=""
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className={cancelClass}
          onClick={() => close("share-post")}
        >
          Dismiss
        </button>
        {data.kind !== "conversation" && (
          <button
            type="button"
            onClick={() => open?.("create-memory")}
            className={primaryClass}
          >
            <PlusIcon width={9} />
            <span>Add story</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SharePost({ data, isMobile = false }: SharePostProps) {
  const { close } = useModal();

  const handleClose = () => close("share-post");

  if (isMobile) {
    return (
      <Sheet
        detent="content"
        isOpen
        onClose={handleClose}
        snapPoints={[0, 0.88]}
        initialSnap={1}
      >
        <Sheet.Container className="max-h-[88dvh] overflow-hidden rounded-t-3xl border border-stroke-neutral-weak !bg-bg-neutral text-text-neutral-strong shadow-lg">
          <Sheet.Header className="rounded-t-3xl bg-bg-neutral" />
          <Sheet.Content className="max-h-[88dvh] min-h-0 overflow-y-auto overscroll-contain px-5 pb-6 pt-1">
            <ModalCloseBtn
              className="!relative ml-auto mb-2 !right-0 !top-0 !bg-fill-neutral-weak text-icon-neutral-strong hover:!bg-fill-neutral-weaker"
              onClick={handleClose}
            />
            <SharePostContent data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop
          className="!bg-overlay-backdrop dark:!bg-overlay-backdrop-dark"
          onTap={handleClose}
        />
      </Sheet>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-lg shrink-0 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-container !max-w-120 !p-5 border border-stroke-neutral-weak !bg-bg-neutral text-text-neutral-strong">
        <ModalCloseBtn
          className="!bg-fill-neutral-weak text-icon-neutral-strong hover:!bg-fill-neutral-weaker"
          onClick={handleClose}
        />
        <SharePostContent data={data} />
      </div>
    </div>
  );
}
