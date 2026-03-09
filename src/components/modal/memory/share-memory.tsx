"use client";

import { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { CircleCheckIcon, CopyIcon } from "@/components/icons";
import { ModalCloseBtn } from "../modalLayout";
import { useModal } from "@/hooks/use-modal";
import useCopy from "@/hooks/use-copy";
import { getSocialShareLinks } from "@/utility";
import type { IMemory } from "@/utility/interface";
import facebook from "@/assets/image/Facebook.png";
import twitter from "@/assets/image/twitter.png";
import instagram from "@/assets/image/instagram.png";
import linkedin from "@/assets/image/linkedin.png";

interface ShareMemoryProps {
  data: {
    memory: IMemory;
  };
}

function Content({ data }: ShareMemoryProps) {
  const { memory } = data;
  const [copied, handleCopy] = useCopy();
  const [link, setLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLink(`${window.location.origin}/post/${memory?._id}`);
    }
  }, [memory?._id]);

  const socialPlatforms = getSocialShareLinks({
    shareUrl: link,
    shareText: memory?.title ?? "Check out this story",
    onCopy: handleCopy,
    images: { facebook, linkedin, twitter, instagram },
  });

  return (
    <div className="w-full !max-w-120">
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h4 className="modal-title text-5xl !font-medium text-[#1D2939]">Share this Story</h4>
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <div className="font-inter text-sm font-medium !text-grey-600">
            <span className="font-normal">Share link</span>
            <div className="relative mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2">
              <span className="truncate font-normal whitespace-nowrap">{link}</span>

              <button
                type="button"
                onClick={() => handleCopy(link, "Link copied successfully")}
                className="cursor-pointer border-l border-gray-200 text-orange hover:text-[#C55A1D] transition-colors"
              >
                <div className="flex items-center justify-center gap-1 px-3 py-2">
                  {copied ? (
                    <>
                      <CircleCheckIcon width={16} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon width={16} />
                      <span>Copy</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 border-t border-grey-500" />
            <span className="font-inter text-xs text-[#667085]">Or share on Social Media</span>
            <div className="flex-1 border-t border-grey-500" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 md:justify-between md:gap-11">
            {socialPlatforms.map((platform) => (
              <button
                key={platform.name}
                type="button"
                onClick={platform.onClick}
                className="flex size-[56px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-grey-400 transition-colors hover:border-grey-500 hover:bg-gray-50"
                aria-label={`Share on ${platform.name}`}
              >
                <img
                  className="size-[28px] object-contain"
                  src={platform.img}
                  alt=""
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShareMemory({ data }: ShareMemoryProps) {
  const { close } = useModal();

  const handleClose = () => close?.("share-memory");

  return (
    <div>
      <div className="modal-container hidden sm:flex !p-5">
        <ModalCloseBtn onClick={handleClose} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={handleClose}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-white">
          <Sheet.Header className="rounded-3xl bg-white" />
          <Sheet.Content className="bg-white px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto mb-1 !right-0 !top-0" onClick={handleClose} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}