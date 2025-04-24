"use client";

import FolderIcon from "@/public/icon/folder.svg";
import CalenderIcon from "@/public/icon/calendar-1.svg";
import TextIcon from "@/public/icon/text.svg";
import ClipIcon from "@/public/icon/clip.svg";
import EditIcon from "@/public/icon/edit.svg";
import TrashcanIcon from "@/public/icon/trash.svg";
import LockIcon from "@/public/icon/lock-1.svg";
import ChainIcon from "@/public/icon/chain.svg";
import TagIcon from "@/public/icon/tag.svg";
import ClockIcon from "@/public/icon/clock.svg";
import AddBookmarkIcon from "@/public/icon/add-bookmark.svg";

import React from "react";
import { useModal } from "@/hooks/use-modal";
import { IMemory } from "@/utility/interface";
import dayjs from "dayjs";
import { isEmpty } from "@/utility";
import { DetailsSideBarSkeleton } from "./Skeleton";
import PropsItem from "@/components/PropsItem";

export default function MemoryDetailsSidebar({ memory }: { memory: IMemory }) {
  const { open } = useModal();

  const handleOpenFiles = () => {
    if (isEmpty(memory.attachments)) return;
    open("file-preview", memory.attachments)
  }
  if (isEmpty(memory)) return <DetailsSideBarSkeleton />
  return (
    <div className="size-full space-y-3 bg-[#FCFCFD] p-6">
      <div className="space-y-4 border-b border-grey-500 pb-14">
        <span className="block font-inter text-xs font-medium text-grey-800 uppercase">
          properties
        </span>
        <ul className="space-y-4">
          <PropsItem
            icon={<FolderIcon width={16} />}
            title="post type:"
            subtitle="story"
          />
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="created:"
            subtitle={dayjs(memory.created_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="last updated:"
            subtitle={dayjs(memory.updated_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<LockIcon width={13} />}
            title="permission level:"
            subtitle={`lvl ${memory.level}`}
          />
        </ul>
      </div>
      <div className="space-y-4 border-b border-grey-500 pb-14">
        <span className="block font-inter text-xs font-medium text-grey-800 uppercase">
          stats
        </span>
        <ul className="space-y-4">
          {
            !isEmpty(memory?.body) &&
            <PropsItem
              icon={<TextIcon width={13} />}
              title="word count:"
              subtitle={<span className="mem-tags">{memory?.body.split(/\s+/).length}</span>}
            />
          }
          <PropsItem
            icon={<ClipIcon width={13} />}
            title="attachment:"
            subtitle={<span className="mem-tags">{memory.attachments.length || 0}</span>}
          />
          <PropsItem
            icon={<TagIcon width={16} />}
            title="tags:"
            className="!items-start"
            subtitle={
              <div className="flex items-center gap-2 flex-wrap">
                {memory.tags.map(t => <span key={t} className="mem-tags">{t}</span>)}
              </div>
            }
          />
        </ul>
      </div>
      <div className="space-y-4 border-b border-grey-500 pb-14">
        <span className="block font-inter text-xs font-medium text-grey-800 uppercase">
          actions
        </span>
        <ul className="space-y-4">
          <PropsItem
            icon={<EditIcon width={13} />}
            title="Edit this post"
            onClick={() => open("edit-memory", memory)}
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<AddBookmarkIcon width={13} />}
            title="add to bookmark"
            onClick={handleOpenFiles}
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<ChainIcon width={16} />}
            title="share story"
            onClick={() => open("share-post", memory._id)}
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<ClockIcon width={16} />}
            title="show edit history"
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<TrashcanIcon width={16} />}
            title="delete"
            onClick={() => open("delete-memory", memory._id)}
            className="cursor-pointer !text-sm !font-medium !text-danger"
          />
        </ul>
      </div>
    </div>
  );
}
