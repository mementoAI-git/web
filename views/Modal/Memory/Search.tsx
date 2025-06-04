import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import SearchIcon from "@/public/icon/dashboard/search.svg";
import ArrowRightIcon from "@/public/icon/arrow-right.svg"

export function SearchMemories() {
  const { close } = useModal()
  return (
    <div className="modal-container !max-w-200">
      <ModalCloseBtn onClick={() => close("search-memory")} />
      <div className="space-y-6">
        <h4 className="text-2xl font-semibold font-inter text-secondary">Search Memento</h4>
        <div className="flex h-full flex-1 items-center gap-2 rounded-full border border-[rgba(208,213,221,1)] px-[14px] py-2">
          <SearchIcon />
          <input placeholder="Search" className="flex-1 outline-0" />
          <div className="bg-secondary cursor-pointer flex justify-center items-center text-white rounded-full size-6">
            <ArrowRightIcon width={11} />
          </div>
        </div>
        <div>
          <span className="font-inter font-semibold text-sm text-secondary">Recently opened posts:</span>
        </div>
      </div>
    </div>
  )
}