
import questionImage from "@/assets/image/question-2.png"
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
    <div className="border border-sand-4 rounded-xl md:rounded-2xl p-3 sm:p-4.5 md:p-6 flex items-center gap-10">
      <div className="size-[86px] shrink-0 hidden sm:flex items-center justify-center">
        <img className="size-full shrink-0 object-contain" alt="Question icon" src={questionImage} />
      </div>

      <div className="space-y-2 flex-1 sm:space-y-4">
        <div className="flex items-center justify-between">
          <button className="rounded-full cursor-pointer hover:scale-[97%] gap-[6px] flex items-center text-xs border-[1.5px] text-sand-10 border-sand-10 px-2 sm:px-3 py-0.5 sm:py-1">
            Question
          </button>
          {
            memory?._id &&
            <div className="flex gap-1 items-center text-sand-12">
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2"
                onClick={() => open("share-post", memory?._id)}
              >
                <Launch2Icon className="stroke-[1.5px] size-full text-sand-12 cursor-pointer" />
              </div>
              <div
                className="text-sand-12 flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-sand-2" onClick={toggleBookmark}>
                {
                  memory.bookmarked ?
                    <BookmarkSolidIcon className="text-sand-8 size-full stroke-2 cursor-pointer" /> :
                    <BookmarkIcon className="text-sand-12  size-full stroke-2 cursor-pointer" />
                }
              </div>
              <MemoryDropdown {...{ memory, onViewDetails }} />
            </div>
          }
        </div>
        <h3 className="md:text-xl md:font-medium font-garamond text-sand-12">
          {memory?.title || "New conversation"}
        </h3>
      </div>
    </div>
  )
}