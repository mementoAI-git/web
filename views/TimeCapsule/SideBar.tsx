"use client";
import React from "react";

import CalenderIcon from "@/public/icon/calendar-1.svg";
import TextIcon from "@/public/icon/text.svg";
import ClipIcon from "@/public/icon/clip.svg";
import EditIcon from "@/public/icon/edit.svg";
import TrashcanIcon from "@/public/icon/trash.svg";
import LockIcon from "@/public/icon/lock-1.svg";
import AddBookmarkIcon from "@/public/icon/add-bookmark.svg";

import { useModal } from "@/hooks/use-modal";
import dayjs from "dayjs";
import PropsItem from "@/components/PropsItem";
import { ICapsule } from "@/utility/interface";
import { isEmpty } from "@/utility";
import { DetailsSideBarSkeleton } from "./Skeleton";

export default function CapsulesSidebar({ data }: { data: ICapsule }) {
  const { open } = useModal();

  if (isEmpty(data)) return <DetailsSideBarSkeleton />
  return (
    <div className="size-full space-y-3 bg-[#FCFCFD] p-6">
      <div className="space-y-4 border-b border-grey-500 pb-14">
        <span className="block font-inter text-xs font-medium text-grey-800 uppercase">
          properties
        </span>
        <ul className="space-y-4">
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="created:"
            subtitle={dayjs(data?.created_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<CalenderIcon width={13} />}
            title="Delivery date:"
            subtitle={dayjs(data?.delivery_date).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<LockIcon width={13} />}
            title="Status:"
            subtitle={<span className="mem-tags">{data?.status}</span>}
          />
        </ul>
      </div>
      <div className="space-y-4 border-b border-grey-500 pb-14">
        <span className="block font-inter text-xs font-medium text-grey-800 uppercase">
          stats
        </span>
        <ul className="space-y-4">
          <PropsItem
            icon={<TextIcon width={13} />}
            title="word count:"
            subtitle={<span className="mem-tags">{2}</span>}
          />
          <PropsItem
            icon={<ClipIcon width={13} />}
            title="attachment:"
            subtitle={<span className="mem-tags">{6}</span>}
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
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<AddBookmarkIcon width={13} />}
            title="Pause Delivery"
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
          <PropsItem
            icon={<TrashcanIcon width={16} />}
            title="delete"
            onClick={() => open("delete-capsule", data._id)}
            className="cursor-pointer !text-sm !font-medium !text-danger"
          />
        </ul>
      </div>
    </div>
  );
}
