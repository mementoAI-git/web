"use client";

import { Sparkles } from "lucide-react";

export function CreateMemoryAssistantComingSoonPanel() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="mx-auto flex max-w-[262px] flex-col items-center text-center">
        <div className="flex size-[100px] items-center justify-center rounded-full bg-fill-neutral-weaker">
          <div className="relative flex flex-col gap-[3px]">
            <span className="block h-[5px] w-10 rounded-full bg-[#f1d8b9]" />
            <span className="block h-[5px] w-[34px] rounded-full bg-[#dce8d6]" />
            <span className="block h-[5px] w-6 rounded-full bg-[#e9eee8]" />
            <Sparkles className="absolute -right-2 -top-4 size-3.5 text-text-brand-strong" strokeWidth={2} />
          </div>
        </div>

        <h3 className="mt-2.5 font-inter text-[20px] font-semibold leading-7 text-text-neutral-strong">
          Assistant coming soon!
        </h3>
        <p className="mt-2 font-inter text-sm leading-6 text-text-neutral-weak">
          Assistant will help you with writing your journals and recalling important
          contexts where they matter.
        </p>
      </div>
    </div>
  );
}
