"use client"

import FolderIcon from "@/public/icon/folder.svg"
import CalenderIcon from "@/public/icon/calendar-1.svg"
import TextIcon from "@/public/icon/text.svg"
import ClipIcon from "@/public/icon/clip.svg"
import EditIcon from "@/public/icon/edit.svg"
import TrashcanIcon from "@/public/icon/trash.svg"
import LockIcon from "@/public/icon/lock-1.svg"
import ChainIcon from "@/public/icon/chain.svg"
import TagIcon from "@/public/icon/tag.svg"
import ClockIcon from "@/public/icon/clock.svg"
import AddBookmarkIcon from '@/public/icon/add-bookmark.svg'

import React from "react"
import { useModal } from "@/hooks/use-modal"

interface IPropsItem {
  title: string
  subtitle?: string | React.ReactElement | null
  icon: React.ReactElement
  className?: string
  onClick?: () => void
}

function PropsItem({ title, icon, subtitle = null, className, onClick }: IPropsItem) {
  return (
    <li onClick={onClick || null} className={`text-grey-800 text-xs flex font-normal items-center capitalize gap-2 font-inter ${className}`}>
      {icon}
      <span>{title} </span>
      <strong className="text-sm text-grey-600 font-medium">{subtitle}</strong>
    </li>
  )
}
export default function MemoryDetailsSidebar() {
  const { open } = useModal()
  return (
    <div className="bg-[#FCFCFD] size-full p-6 space-y-3">
      <div className="pb-14 border-b border-grey-500 space-y-4">
        <span className="uppercase font-medium text-grey-800 font-inter text-xs block">properties</span>
        <ul className="space-y-4">
          <PropsItem
            icon={<FolderIcon width={16} />}
            title="post type:"
            subtitle="story"
          />
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="created:"
            subtitle="Jan 18, 2025"
          />
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="last updated:"
            subtitle="just now"
          />
          <PropsItem
            icon={<LockIcon width={13} />}
            title="permission level:"
            subtitle="lvl 1"
          />
        </ul>
      </div>
      <div className="pb-14 border-b border-grey-500 space-y-4">
        <span className="uppercase font-medium text-grey-800 font-inter text-xs block">stats</span>
        <ul className="space-y-4">
          <PropsItem
            icon={<TextIcon width={13} />}
            title="word count:"
            subtitle={<span className="mem-tags">1456</span>}
          />
          <PropsItem
            icon={<ClipIcon width={13} />}
            title="attachment:"
            subtitle={<span className="mem-tags">5</span>}
          />
          <PropsItem
            icon={<TagIcon width={16} />}
            title="tags:"
            subtitle="just now"
          />
        </ul>
      </div>
      <div className="pb-14 border-b border-grey-500 space-y-4">
        <span className="uppercase font-medium text-grey-800 font-inter text-xs block">actions</span>
        <ul className="space-y-4">
          <PropsItem
            icon={<EditIcon width={13} />}
            title="Edit this post"
            className="!text-sm !text-grey-600 !font-medium cursor-pointer"
          />
          <PropsItem
            icon={<AddBookmarkIcon width={13} />}
            title="add to bookmark"
            onClick={() => open("welcome")}
            className="!text-sm !text-grey-600 !font-medium cursor-pointer"
          />
          <PropsItem
            icon={<ChainIcon width={16} />}
            title="share story"
            onClick={() => open("share-post", { id: "" })}
            className="!text-sm !text-grey-600 !font-medium cursor-pointer"
          />
          <PropsItem
            icon={<ClockIcon width={16} />}
            title="show edit history"
            className="!text-sm !text-grey-600 !font-medium cursor-pointer"
          />
          <PropsItem
            icon={<TrashcanIcon width={16} />}
            title="delete"
            className="!text-sm !text-danger !font-medium cursor-pointer"
          />
        </ul>
      </div>
    </div>
  )
}