"use client"

import { useModal } from "@/hooks/use-modal";
import CopyIcon from "@/public/icon/copy.svg";
import CircleCheckIcon from "@/public/icon/circle-check.svg";
import Image from "next/image";
import facebook from "@/public/image/Facebook.png";
import twitter from "@/public/image/twitter.png";
import instagram from "@/public/image/instagram.png";
import linkedin from "@/public/image/linkedin.png";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useCopy from "@/hooks/use-copy";
import { Sheet } from "react-modal-sheet";

function Content({ data: id }) {
  const { close } = useModal();
  const [copied, handleCopy] = useCopy()
  const link = `${window.origin}/post/${id}`
  return (
    <div className="w-full !max-w-120">
      <div className="space-y-6">
        <h4 className="modal-title">Share this post</h4>
        <div className="space-y-6">
          <div className="font-inter text-sm font-medium !text-grey-600">
            <span className="font-normal">Share link</span>
            <div className="relative mt-2 flex items-center justify-between rounded-lg border-dashed border border-sand-4 bg-sand-2 p-2">
              <span className="font-normal truncate whitespace-nowrap">
                {link}
              </span>

              <button
                onClick={() => handleCopy(link, "Link copied successfully")}
                className="flex cursor-pointer items-center justify-center gap-1 rounded-full bg-blue-6 px-3 py-2 text-white"
              >
                {
                  copied ?
                    <CircleCheckIcon width={16} /> :
                    <>
                      <CopyIcon width={16} />
                      <span>Copy</span>
                    </>
                }
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-grey-500" />
            <span className="font-inter text-xs text-[#667085]">
              Or share on Social Media
            </span>
            <div className="flex-1 border-t border-grey-500" />
          </div>

          <div className="flex items-center justify-center md:justify-between gap-3 md:gap-11">
            {[facebook, linkedin, twitter, instagram].map((img, i) => (
              <div
                key={i}
                className="flex cursor-pointer size-17 items-center justify-center rounded-full border border-grey-400"
              >
                <Image
                  className="size-8 object-contain"
                  src={img}
                  key={i}
                  alt="social logos"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
}

export function SharePost({ data }: { data: { id: string } }) {
  const { close } = useModal();

  return (
    <div>
      <div className="hidden sm:flex modal-container">
        <ModalCloseBtn onClick={() => close("share-post")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close("share-post")}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-sand-1" >
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-0 !top-0 mb-1" onClick={() => close("share-post")} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}