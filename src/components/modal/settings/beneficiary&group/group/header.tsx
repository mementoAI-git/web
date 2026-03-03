"use client";

import { Searchinput } from "@/components/Form";
import { PlusIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utility";

interface GroupHeaderProps {
  count?: number;
}

export default function GroupHeader({ count = 0 }: GroupHeaderProps) {
  const { push } = useModal();

  return (
    <div className="flex w-full flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <span className="font-inter text-sm font-medium text-[#050709]">Groups</span>
        <span className="block shrink-0 rounded-full bg-grey-500 px-3 py-0.5 font-inter text-xs text-grey-600">
          {count} {count === 1 ? "group" : "groups"}
        </span>
      </div>
      <div className="flex w-full flex-col items-stretch gap-2 sm:gap-3 lg:h-10 sm:flex-row sm:items-center justify-between">
        <div className="w-full sm:max-w-[303px] flex-1">
          <Searchinput className="!bg-white border-gray-300" />
        </div>
        <button
          type="button"
          onClick={() => push?.("add-group")}
          className={cn("btn", "!w-full !rounded-lg !bg-gray-950 sm:!w-fit")}
        >
          <PlusIcon width={15} height={15} />
          <span className="font-inter text-sm font-semibold text-white">Add Group</span>
        </button>
      </div>
    </div>
  );
}
