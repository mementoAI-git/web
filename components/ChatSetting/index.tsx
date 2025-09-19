"use client";

import TimesIcon from "@/public/icon/times.svg";
import BackgroundMusic from "./BackgroudMusic";
import UpgradePlan from "./UpgradePlan";
import Voices from "./Voices";
import { PropsWithChildren, useState } from "react";
import { Sheet } from 'react-modal-sheet';
import { createPortal } from "react-dom";

function Content({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 bg-sand-1">
      <div className="text-secondary flex items-center justify-between w-full mb-4 sm:mb-6">
        <span className="modal-title !text-2xl sm:text-[32px]">Chat settings</span>
        <div onClick={onClose} className="cursor-pointer p-1">
          <TimesIcon width={12} height={12} />
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:gap-6">
        <UpgradePlan />
        <div className="border-y border-gray-200 py-4 sm:py-6">
          <BackgroundMusic />
        </div>
        <Voices />
      </div>
    </div>
  )
}

export default function ChatSettings({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      {
        isOpen &&
        <div>
          <div className="block sm:hidden">
            <Sheet detent="content" className="block sm:hidden" isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <Sheet.Container className="bg-sand-1" >
                <Sheet.Header className="bg-sand-1 rounded-3xl" />
                <Sheet.Content className="bg-sand-1">
                  <Content onClose={() => setIsOpen(false)} />
                </Sheet.Content>
              </Sheet.Container>
              <Sheet.Backdrop />
            </Sheet>
          </div>
          <div className="">
            {
              createPortal(
                <div
                  className="absolute hidden bottom-5 right-5 w-full max-w-[400px] sm:w-96 md:w-120 h-full max-h-[95%] bg-sand-1 border-sand-3 rounded-2xl py-4 sm:py-6 border sm:flex flex-col gap-4 sm:gap-6 shadow-[0px_75px_150px_0px_#34405424]"
                >
                  <Content onClose={() => setIsOpen(false)} />
                </div>,
                document.body
              )
            }
          </div>
        </div>
      }
    </div>
  )
}