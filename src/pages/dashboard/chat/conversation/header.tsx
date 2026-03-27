import recentActivitiesIcon from "@/assets/icon/homepage/recent activities icon.svg";
import { BookmarkIcon, Launch2Icon, BookmarkSolidIcon } from "@/components/icons"
import { type IMemory } from "@/utility/interface"
import { MemoryDropdown } from "./dropdown"
import { useModal } from "@/hooks/use-modal"
import { useBookmark } from "@/hooks/use-bookmark"

export default function ConversationHeader({ memory, onViewDetails }: { memory: IMemory, onViewDetails: () => void }) {
  const { open } = useModal()
  const { toggleBookmark } = useBookmark({
    memoryId: memory?._id,
    isBookmarked: memory?.bookmarked
  });

  return (
    <div className="h-fit w-full border border-v3-stroke-weak rounded-xl md:rounded-2xl py-4 px-3.5 flex items-center gap-4 overflow-hidden">
      <div className="size-10 shrink-0 hidden sm:flex items-center justify-center rounded-xl bg-v3-fill-weaker">
        <img
          className="size-full shrink-0 object-contain"
          alt=""
          src={recentActivitiesIcon}
        />
      </div>

      <div className="flex h-fit flex-1 flex-row items-start justify-center gap-3 sm:gap-4">
        <h3 className="w-full md:text-2xl md:font-normal font-garamond text-v3-text-strong">
          {memory?.title || "New conversation"}
        </h3>
        {memory?._id && (
          <div className="flex items-center justify-end">
            <div className="flex gap-1 items-center text-v3-text-strong">
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-v3-fill-weaker"
                onClick={() =>
                  memory?._id && open("share-post", { id: memory._id })
                }
              >
                <Launch2Icon className="stroke-[1.5px] size-full text-v3-text-strong cursor-pointer" />
              </div>
              <div
                className="text-v3-text-strong flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-v3-fill-weaker" onClick={toggleBookmark}>
                {
                  memory.bookmarked ?
                    <BookmarkSolidIcon className="text-v3-text-strong size-full stroke-2 cursor-pointer" /> :
                    <BookmarkIcon className="text-v3-text-strong size-full stroke-2 cursor-pointer" />
                }
              </div>
              <MemoryDropdown {...{ memory, onViewDetails }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}