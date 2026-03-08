"use client";

import { useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import { TimesIcon } from "@/components/icons";
import BackgroundMusic from "./background-music";
import UpgradePlan from "./upgrade-plan";
import Voices from "./voices";

function Content({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-white px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex w-full items-center justify-between text-secondary sm:mb-6">
        <span className="modal-title !text-2xl sm:text-[32px]">Chat settings</span>
        <button type="button" onClick={onClose} className="cursor-pointer p-1">
          <TimesIcon width={12} height={12} />
        </button>
      </div>
      <div className="flex flex-col gap-4 sm:gap-6">
        <UpgradePlan />
        <div className="border-y border-gray-200 py-4 sm:py-6">
          <BackgroundMusic />
        </div>
        <Voices />
      </div>
    </div>
  );
}

export default function ChatSettings({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <div>
          <div className="block sm:hidden">
            <Sheet detent="content" className="block sm:hidden" isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <Sheet.Container className="bg-white">
                <Sheet.Header className="rounded-3xl bg-white" />
                <Sheet.Content className="bg-white">
                  <Content onClose={() => setIsOpen(false)} />
                </Sheet.Content>
              </Sheet.Container>
              <Sheet.Backdrop />
            </Sheet>
          </div>
          {createPortal(
            <div className="absolute bottom-5 right-5 hidden h-full max-h-[95%] w-full max-w-[400px] flex-col gap-4 rounded-2xl border border-sand-3 bg-white py-4 shadow-[0px_75px_150px_0px_#34405424] sm:flex md:w-120">
              <Content onClose={() => setIsOpen(false)} />
            </div>,
            document.body,
          )}
        </div>
      )}
    </div>
  );
}

