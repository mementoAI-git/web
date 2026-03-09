"use client";

import PropsItem from "@/components/props-item";
import type { IMemory } from "@/utility/interface";
import { getPostTypeLabel, type PostTypeSource } from "@/utility/memory";

// import FolderIcon from "@/public/icon/folder.svg";
// import CalenderIcon from "@/public/icon/calendar-1.svg";
// import LockIcon from "@/public/icon/lock-1.svg";
// import ClipIcon from "@/public/icon/clip.svg";
// import TagIcon from "@/public/icon/tag.svg";
// import TimesIcon from "@/public/icon/times.svg";
// import EditIcon from "@/public/icon/edit.svg";

import {
  FolderIcon,
  Calendar1Icon,
  LockIcon,
  ClipIcon,
  TagIcon,
  TimesIcon,
  EditIcon
} from "@/components/icons";

import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import { Sheet } from 'react-modal-sheet';

interface SidebarDetailsProps {
  memory: IMemory;
  onClose: () => void;
  isOpen: boolean;
  source?: PostTypeSource;
}

interface ContentProps {
  memory: IMemory;
  onClose: () => void;
  isMobile?: boolean;
  source?: PostTypeSource;
}

function Content({ memory, onClose, isMobile = false, source }: ContentProps) {
  const { open } = useModal();

  const handleEditPermission = () => {
    open("set-tag-permission", { memory, isNew: false });
    if (isMobile) {
      onClose();
    }
  }

  return (
    <div className="size-full space-y-2 sm:space-y-3 p-3 sm:p-4 lg:p-6">
      <div className="flex justify-end">
        <div
          className="p-3 cursor-pointer ml-auto inline-block hover:bg-sand-3 rounded-lg"
          onClick={onClose}
        >
          <TimesIcon className="ml-auto text-sand-8" width={10} height={10} />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4 border-b border-[#EAECF0] pb-8 sm:pb-10 lg:pb-14">
        <span className="block font-inter text-xs text-[#667085] uppercase">
          properties
        </span>
        <ul>
          <PropsItem
            icon={<FolderIcon width={16} />}
            title="post type:"
            subtitle={getPostTypeLabel(memory, source)}
          />
          <PropsItem
            icon={<Calendar1Icon width={13} />}
            title="created:"
            subtitle={dayjs(memory.created_at).format("MMM DD, YYYY")}
          />
          <PropsItem
            icon={<Calendar1Icon width={13} />}
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
      <div className="space-y-3 sm:space-y-4 border-b border-[#EAECF0] pb-8 sm:pb-10 lg:pb-14 mt-4">
        <span className="block font-inter text-xs text-[#667085] uppercase">
          stats
        </span>
        <ul>
          <PropsItem
            icon={<ClipIcon width={13} />}
            title="attachment:"
            subtitle={<span className="mem-tags">{memory?.attachments?.length || 0}</span>}
          />
          <PropsItem
            icon={<TagIcon width={16} />}
            title="tags:"
            className="!items-start"
            subtitle={
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {memory.tags.map(t => <span key={t} className="mem-tags text-xs sm:text-sm">{t}</span>)}
                <span
                  onClick={() => open("set-tag-permission", { memory, isNew: false })}
                  className="mem-tags !border !border-[#1D2939] !bg-transparent text-xs sm:text-sm"
                >
                  + Add tag
                </span>
              </div>
            }
          />
        </ul>
      </div>
      <div className="space-y-3 sm:space-y-4 pb-8 sm:pb-10 lg:pb-14 mt-4">
        <span className="block font-inter text-xs text-[#667085] uppercase">
          actions
        </span>
        <ul>
          <PropsItem
            icon={<EditIcon width={13} />}
            title="Edit permission & tags"
            onClick={handleEditPermission}
            className="cursor-pointer !text-sm !font-medium !text-grey-600"
          />
        </ul>
      </div>
    </div>
  );
}

export default function SidebarDetails({ memory, onClose, isOpen, source }: SidebarDetailsProps) {
  return (
    <>
      <Sheet
        detent="content"
        isOpen={isOpen}
        className="block md:hidden"
        onClose={onClose}
        snapPoints={[0.5, 0.75, 1]}
      >
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1">
            <Content memory={memory} onClose={onClose} isMobile source={source} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      <div
        className={`h-full hidden md:block border-l border-[#EAECF0] transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-60' : 'w-0'
          }`}
      >
        <Content memory={memory} onClose={onClose} isMobile={false} source={source} />
      </div>
    </>
  );
}