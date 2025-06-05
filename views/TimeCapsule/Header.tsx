"use client";

import { Searchinput } from "@/components/Form";
import PlusIcon from "@/public/icon/plus.svg"
import { useModal } from "@/hooks/use-modal";

interface IMemoriesHeader {
  count?: number;
}

export default function TimeCapsulesHeader({ count = 0 }: IMemoriesHeader) {
  const { open } = useModal()
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-inter text-xl leading-[30px] font-semibold text-grey-900">
          Messages
        </span>
        <span className="block rounded-full bg-grey-500 px-3 py-0.5 font-inter text-xs text-grey-600">
          {count} message{count > 1 && "s"}
        </span>
      </div>
      <div className="flex items-stretch max-h-10 gap-3">
        <div onClick={() => open("search-memory")}>
          <Searchinput />
        </div>
        <button onClick={() => open("create-capsule")} className="flex items-center justify-center gap-1 bg-secondary rounded-lg min-x-49.5 px-4 text-white cursor-pointer">
          <PlusIcon width={15} />
          <span>Create New Capsule</span>
        </button>
      </div>
    </div>
  );
}
