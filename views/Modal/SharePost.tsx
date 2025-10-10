"use client"

import { useModal } from "@/hooks/use-modal";
import CopyIcon from "@/public/icon/copy.svg";
import CircleCheckIcon from "@/public/icon/circle-check.svg";
import Image from "next/image";
import facebook from "@/public/image/Facebook.png";
import twitter from "@/public/image/twitter.png";
import instagram from "@/public/image/instagram.png";
import linkedin from "@/public/image/linkedin.png";
import PlusIcon from "@/public/icon/plus.svg";
import { cn } from "@/utility";
import confetti from "@/public/image/confetti.png";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useCopy from "@/hooks/use-copy";
import { Sheet } from "react-modal-sheet";

function Content({ data: id }) {
  const { close, open } = useModal();
  const [copied, handleCopy] = useCopy()
  const link = `${window.origin}/post/${id}`
  return (
    <div className="w-full !max-w-120">
      <div className="space-y-6">
        <div className="flex justify-start w-fit">
          <Image src={confetti} alt="Confetti" className="size-14 object-contain" />
        </div>
        <div>
          <h4 className="modal-title text-[#1D2939] text-5xl">Story added successfully</h4>
          <p className="text-[#475467] ">You have added a new story to your Memento</p>
        </div>

        <div className="space-y-4 border border-gray-200 p-6 rounded-lg">
          <div className="font-inter text-sm font-medium !text-grey-600">
            <span className="font-normal">Share link</span>
            <div className="relative mt-2 flex items-center justify-between rounded-lg border border-gray-200 p-2">
              <span className="font-normal truncate whitespace-nowrap">
                {link}
              </span>

              <button
                onClick={() => handleCopy(link, "Link copied successfully")}
                className="cursor-pointer text-blue-6 border-l border-gray-200"
              >
                <div className="flex px-3 py-2 items-center justify-center gap-1">
                  {
                    copied ?
                      <>
                        <CircleCheckIcon width={16} />
                        <span>Copied</span>
                      </>
                      :
                      <>
                        <CopyIcon width={16} />
                        <span>Copy</span>
                      </>
                  }
                </div>

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
                className="flex cursor-pointer size-[56px] items-center justify-center rounded-full border border-grey-400"
              >
                <Image
                  className="size-[28px] object-contain"
                  src={img}
                  key={i}
                  alt="social logos"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center md:justify-end gap-3">
          <button onClick={() => close("share-post")} className="btn-outline border">Dismiss</button>
          <button onClick={() => open("create-memory")} className={cn("btn", "!rounded-full w-fit")}>
            <PlusIcon width={9} />
            <span>Add Story</span>
          </button>
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
        {/* <ModalCloseBtn onClick={() => close("share-post")} /> */}
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