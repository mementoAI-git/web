"use client";

import { useNavigate } from "react-router-dom";
import { cn } from "@/utility";
import { DropdownIcon } from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { useBookmark } from "@/hooks/use-bookmark";
import chatIcon from "@/assets/image/chat.png";
import { InfoIcon, TrashIcon, VerticalEllipseIcon } from "@/components/icons";
import { BookmarkIcon } from "./icons/bookmark";

const dropdownItems = [
  {
    label: "Bookmark",
    value: "bookmark",
    startIcon: <BookmarkIcon className="size-4" />,
  },
  {
    label: "View details",
    value: "details",
    startIcon: <InfoIcon className="size-4" />,
  },
];

interface ConversationBarProps {
  title: string;
  _id: string;
  bookmarked?: boolean;
  size?: "sm" | "lg";
}

export default function ConversationBar({
  title,
  _id,
  bookmarked = false,
  size = "sm",
}: ConversationBarProps) {
  const isLarge = size === "lg";
  const navigate = useNavigate();
  const { open } = useModal();
  const { toggleBookmark } = useBookmark({
    memoryId: _id,
    isBookmarked: bookmarked,
  });

  const handleDropdownSelect = (value: string) => {
    switch (value) {
      case "bookmark":
        toggleBookmark();
        break;
      case "details":
        navigate(`/chat/${_id}`);
        break;
      default:
        break;
    }
  };

  const handleClick = () => {
    navigate(`/chat/${_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-xl border border-sand-4 px-3 py-2",
        { "p-3 sm:p-6": isLarge },
      )}
    >
      <div className="flex items-center gap-4">
        <img
          alt="Chat icon"
          className={cn("size-[35px]", {
            "size-[25px] sm:size-[56px]": isLarge,
          })}
          src={chatIcon}
        />
        <span
          className={cn("font-georgia text-sand-12", {
            "text-sand-12 sm:text-xl": isLarge,
          })}
        >
          {title}
        </span>
      </div>
      <div onClick={(event) => event.stopPropagation()}>
        <DropdownIcon
          items={dropdownItems}
          onSelect={handleDropdownSelect}
          icon={
            <VerticalEllipseIcon
              className={cn("size-4", { "size-3 sm:size-4": isLarge })}
            />
          }
          className="rounded-lg p-2 hover:bg-sand-2"
          footerItem={
            <li
              onClick={() => open?.("delete-memory", { memory: { _id } })}
              className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-1.5 text-[#F97066] hover:bg-[#F97066]/8"
            >
              <TrashIcon width={16} height={16} />
              <span className="font-inter text-sm">Delete</span>
            </li>
          }
        />
      </div>
    </div>
  );
}

export function ConversationBarSkeleton({
  size = "sm",
}: {
  size?: "sm" | "lg";
}) {
  const isLarge = size === "lg";
  return (
    <div
      className={cn(
        "flex w-full animate-pulse items-center justify-between rounded-2xl border border-sand-4 px-3 py-2",
        {
          "p-3 sm:p-6": isLarge,
        },
      )}
    >
      <div className="flex flex-1 items-center gap-4">
        <div
          className={cn("size-10 rounded bg-sand-3", {
            "size-20 sm:size-30": isLarge,
          })}
        />
        <div
          className={cn("h-4 w-full max-w-50 rounded bg-sand-3", {
            "max-w-60": isLarge,
          })}
        />
      </div>
      <div className="size-4 shrink-0 rounded bg-sand-3" />
    </div>
  );
}
