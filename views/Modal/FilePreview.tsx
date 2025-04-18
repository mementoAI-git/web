import { IFile } from "@/utility/interface";
import image1 from "@/public/image/image-3.jpeg";
import image2 from "@/public/image/image-2.jpeg";
import Image from "next/image";
import BackwardIcon from "@/public/icon/15-sec-back.svg";
import ForwardIcon from "@/public/icon/15-sec-forward.svg";
import PlayIcon from "@/public/icon/play.svg";
import PlaySolidIcon from "@/public/icon/play-solid.svg";
import VolumeIcon from "@/public/icon/volume.svg";

import { useModal } from "@/hooks/use-modal";
import { useEffect, useState } from "react";

function VideoPreview() {
  return (
    <div className="w-full max-w-250 max-h-120 mx-auto rounded-[9px] relative overflow-hidden">
      <Image src={image2} className="size-full object-cover" alt="" />
      <div className="absolute p-3 top-0 right-0 left-0 bottom-0 size-full flex items-end">
        <div className="w-full space-y-2">
          <div className="text-white flex items-center gap-2">
            <div className="cursor-pointer">
              <PlaySolidIcon width={13} />
            </div>
            <div className="flex-1 h-[9px] bg-white/20 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between font-inter text-white font-semibold text-[13px]">
            <span>0:00</span>
            <span>8:24</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioPreview() {
  return (
    <div className="modal-container flex !min-h-126 !w-154.5">
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#F3F3F3] bg-[#FCFCFD]">
        <div className="w-62.5 space-y-6">
          <span className="block font-inter font-semibold text-secondary">
            What is one of your earliest childhood memories.wav
          </span>
          <div className="space-y-2">
            <div className="h-1 w-full rounded-[1px] bg-[#DCC7FF]">
              <div className="relative h-full w-1/2 bg-primary">
                <div className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-inter text-xs font-medium text-secondary">
                1:43/<span className="font-normal text-grey-800">4:00</span>
              </span>
              <span>
                <VolumeIcon width={10} />
              </span>
            </div>
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex size-11 items-center justify-center rounded-full bg-grey-500">
              <BackwardIcon width={24} />
            </div>
            <div className="btn !px-8 !py-3">
              <PlayIcon width={11} />
              <span className="font-inter text-sm font-semibold">Play</span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-full bg-grey-500">
              <ForwardIcon width={24} />
            </div>
          </div>
          <div>
            <span className="mx-auto block text-center font-inter text-xs text-secondary">
              Show transcription
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilePreview({ files }: { files: IFile[] }) {
  const [index, setIndex] = useState(0)
  const { close } = useModal();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % files.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="relative flex items-center justify-center flex-col min-w-[80%]">
      <div onClick={() => close()} className="absolute cursor-pointer -top-9 -right-9 size-10 flex items-center justify-center text-white rounded-full bg-black/[32%]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2L22 22M22 2L2 22" stroke="#FCFCFD" strokeWidth="2.33333" strokeLinecap="round" />
        </svg>
      </div>
      {
        files.map((img, i) => (
          <div key={i} className={`transition-opacity duration-1000 ease-in-out ${index === i ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
            {
              img.type.includes("video") ?
                <VideoPreview /> :
                img.type.includes("audio") ?
                  <AudioPreview /> :
                  <Image
                    src={img.url} alt=""
                    className={`rounded-2xl max-w-200 max-h-200 border-[3px] border-grey-500`}
                  />
            }
          </div>
        ))
      }
      <div>
        <div className="mx-auto mt-7 flex w-fit items-center justify-center gap-1 rounded-full bg-black/[32%] px-2 py-1">
          {
            files.map((_, i) => (
              <div
                key={i}
                onClick={() => setIndex(i)}
                className={`size-2 cursor-pointer rounded-full ${index === i ? "bg-white" : "bg-[#C7C9C8]"}`}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}
