"use client";

import Image from "next/image";
import EllipseIcon from "@/public/icon/vertical-ellipse.svg";
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg";
import TrashIcon from "@/public/icon/trash.svg";
import InfoIcon from "@/public/icon/info.svg";
import LaunchIcon from "@/public/icon/lauch.svg";
import chatIcon from "@/public/image/chat.png"
import { cn } from "@/utility";
import { DropdowmIcon } from "@/components/Dropdown";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import { useBookmark } from "@/hooks/use-bookmark";

export default function TopicBar({ title, _id, bookmarked = false, size = "sm" }) {
  const isLarge = size === "lg"
  const router = useRouter()
  const { open } = useModal()
  const { toggleBookmark } = useBookmark({ memoryId: _id, isBookmarked: bookmarked });

  const dropdownItems = [
    { label: "Share", value: "share", startIcon: <LaunchIcon className="size-4 stroke-[1.5]" /> },
    { label: "Bookmark", value: "bookmark", startIcon: <BookmarkIcon className="size-4 stroke-2" /> },
    { label: "View details", value: "details", startIcon: <InfoIcon className="stroke-2" /> },
  ];

  const handleDropdownSelect = (value: string) => {
    switch (value) {
      case "share":
        open("share-post", _id);
        break
      case "bookmark":
        toggleBookmark()
        break;
      case "details":
        router.push(`/chat/${_id}`)
        break
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Navigate to chat when clicking the container
    router.push(`/chat/${_id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full rounded-xl border-sand-4 border flex items-center justify-between px-3 py-2 cursor-pointer", {
        "p-3 sm:p-6": isLarge
      })}
    >
      <div className="flex items-center gap-4">
        <Image
          alt="Chat icon"
          className={cn("size-[35px]", { "size-[25px] sm:size-[56px]": isLarge })}
          src={chatIcon}
        />
        <span className={cn("font-georgia text-sand-12", { "sm:text-xl text-sand-12": isLarge })}>
          {title}
        </span>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <DropdowmIcon
          items={dropdownItems}
          onSelect={handleDropdownSelect}
          icon={<EllipseIcon className={cn("size-4", { "size-3 sm:size-4": isLarge })} />}
          className="hover:bg-sand-2 rounded-lg p-2"
          footerItem={
            < li
              onClick={() => open("delete-memory", _id)}
              className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
            >
              <TrashIcon width={16} size={16} />
              <span className="font-inter text-sm">Delete</span>
            </li >
          }
        />
      </div>
    </div>
  )
}

export function TopicBarSkeleton({ size = "sm" }) {
  const isLarge = size === "lg"
  return (
    <div className={cn("w-full rounded-2xl border-sand-4 border flex items-center justify-between px-3 py-2 animate-pulse", {
      "p-3 sm:p-6": isLarge
    })}>
      <div className="flex flex-1 items-center gap-4">
        <div className={cn("size-10 bg-sand-3 rounded", { "size-20 sm:size-30": isLarge })} />
        <div className={cn("h-4 w-full max-w-50 bg-sand-3 rounded", { "max-w-60": isLarge })} />
      </div>
      <div className="size-4 shrink-0 bg-sand-3 rounded" />
    </div>
  )
}