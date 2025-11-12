"use client";

import { useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { CircleCheckIcon, CopyIcon, PlusIcon } from "@/components/icons";
import { ModalCloseBtn } from "./modalLayout";
import { useModal } from "@/hooks/use-modal";
import useCopy from "@/hooks/use-copy";
import { cn } from "@/utility";
import confetti from "@/assets/image/confetti.png";
import facebook from "@/assets/image/Facebook.png";
import twitter from "@/assets/image/twitter.png";
import instagram from "@/assets/image/instagram.png";
import linkedin from "@/assets/image/linkedin.png";

interface SharePostProps {
  data: { id: string };
}

function Content({ data }: SharePostProps) {
  const { close, open } = useModal();
  const [copied, handleCopy] = useCopy();
  const [link, setLink] = useState<string>("");

  useEffect(() => {
    setLink(`${window.location.origin}/post/${data.id}`);
  }, [data.id]);

  return (
    <div className="w-full !max-w-120">
      <div className="space-y-6">
        <div className="mx-auto flex w-fit sm:mx-0">
          <img src={confetti} alt="Confetti" className="size-14 object-contain" />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="modal-title text-5xl !font-medium text-[#1D2939]">Story added successfully</h4>
          <p className="text-[#475467]">You have added a new story to your Memento</p>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 p-6">
          <div className="font-inter text-sm font-medium !text-grey-600">
            <span className="font-normal">Share link</span>
            <div className="relative mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2">
              <span className="truncate font-normal whitespace-nowrap">{link}</span>

              <button
                type="button"
                onClick={() => handleCopy(link, "Link copied successfully")}
                className="cursor-pointer border-l border-gray-200 text-blue-6"
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

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-grey-500" />
            <span className="font-inter text-xs text-[#667085]">Or share on Social Media</span>
            <div className="flex-1 border-t border-grey-500" />
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-between md:gap-11">
            {[facebook, linkedin, twitter, instagram].map((img, index) => (
              <div
                key={index}
                className="flex size-[56px] cursor-pointer items-center justify-center rounded-full border border-grey-400"
              >
                <img className="size-[28px] object-contain" src={img} alt="social logo" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3 md:justify-end">
          <button type="button" onClick={() => close("share-post")} className="btn-outline border">
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => open?.("create-memory")}
            className={cn("btn", "!rounded-full w-fit")}
          >
            <PlusIcon width={9} />
            <span>Add Story</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SharePost({ data }: SharePostProps) {
  const { close } = useModal();

  const handleClose = () => close("share-post");

  return (
    <div>
      <div className="modal-container hidden sm:flex">
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
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="rounded-3xl bg-sand-1" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto mb-1 !right-0 !top-0" onClick={handleClose} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}
