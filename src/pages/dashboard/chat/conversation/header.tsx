import recentActivitiesIcon from "@/assets/icon/homepage/recent activities icon.svg";
import { BookmarkIcon, Launch2Icon, BookmarkSolidIcon, GearIcon } from "@/components/icons"
import ChatSettings from "@/components/modal/chat-settings";
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
    <div className="h-fit w-full border border-stroke-neutral-weaker rounded-xl md:rounded-2xl py-4 px-3.5 flex items-center gap-4 overflow-hidden">
      <div className="size-10 shrink-0 hidden sm:flex items-center justify-center rounded-xl bg-fill-neutral-weakest">
        <img
          className="size-full shrink-0 object-contain"
          alt=""
          src={recentActivitiesIcon}
        />
      </div>

      <div className="flex h-fit min-w-0 flex-1 flex-row items-center justify-between gap-3 sm:gap-4">
        <h3 className="min-w-0 flex-1 md:text-2xl md:font-normal font-garamond text-text-neutral-strong">
          {memory?.title || "New conversation"}
        </h3>
        <div className="flex shrink-0 items-center gap-1 text-text-neutral-strong">
          {memory?._id ? (
            <>
              <div
                className="aspect-square flex justify-center items-center p-1.5 size-7 sm:size-8 shrink-0 rounded-lg hover:bg-fill-neutral-weakest"
                onClick={() =>
                  memory?._id && open("share-post", { id: memory._id })
                }
              >
                <Launch2Icon className="stroke-[1.5px] size-full text-text-neutral-strong cursor-pointer" />
              </div>
              <div
                className="text-text-neutral-strong flex justify-center items-center p-1.5 aspect-square size-7 sm:size-8 shrink-0 rounded-lg hover:bg-fill-neutral-weakest" onClick={toggleBookmark}>
                {
                  memory.bookmarked ?
                    <BookmarkSolidIcon className="text-text-neutral-strong size-full stroke-2 cursor-pointer" /> :
                    <BookmarkIcon className="text-text-neutral-strong size-full stroke-2 cursor-pointer" />
                }
              </div>
              <MemoryDropdown {...{ memory, onViewDetails }} />
            </>
          ) : null}
          <ChatSettings>
            <button
              type="button"
              aria-label="Chat settings"
              className="flex aspect-square size-7 shrink-0 items-center justify-center rounded-lg p-1.5 text-text-neutral-strong hover:bg-fill-neutral-weakest sm:size-8"
            >
              <GearIcon className="size-full stroke-2" aria-hidden />
            </button>
          </ChatSettings>
        </div>
      </div>
    </div>
  )
}