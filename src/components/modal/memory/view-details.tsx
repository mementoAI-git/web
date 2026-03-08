import { useModal } from "@/hooks/use-modal";
import { ModalCloseBtn } from "../modalLayout";
import PropsItem from "@/components/props-item";
import type { IMemory } from "@/utility/interface";
import dayjs from "dayjs";
import {
  FolderIcon,
  Calendar1Icon,
  LockIcon,
  ClipIcon,
  TagIcon,
} from "@/components/icons";

interface ViewMemoryDetailsProps {
  data: { memory: IMemory };
}

export function ViewMemoryDetails({ data: { memory } }: ViewMemoryDetailsProps) {
  const { close } = useModal();

  return (
    <div
      className="modal-container !max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <ModalCloseBtn onClick={() => close("view-memory-details")} />
      <div className="mt-5 space-y-6">
        <div className="space-y-1">
          <h4 className="modal-title">Story Details</h4>
          <p className="font-inter text-sm text-gray-500 truncate">
            {memory?.title}
          </p>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-5">
          <span className="block font-inter text-xs text-gray-400 uppercase tracking-wide">
            Properties
          </span>
          <ul>
            <PropsItem
              icon={<FolderIcon width={16} />}
              title="Post type:"
              subtitle="Story"
            />
            <PropsItem
              icon={<Calendar1Icon width={13} />}
              title="Created:"
              subtitle={dayjs(memory?.created_at).format("MMM DD, YYYY")}
            />
            <PropsItem
              icon={<Calendar1Icon width={13} />}
              title="Last updated:"
              subtitle={dayjs(memory?.updated_at).format("MMM DD, YYYY")}
            />
            <PropsItem
              icon={<LockIcon width={13} />}
              title="Permission level:"
              subtitle={`Level ${memory?.level ?? 0}`}
            />
          </ul>
        </div>

        <div className="space-y-3">
          <span className="block font-inter text-xs text-gray-400 uppercase tracking-wide">
            Stats
          </span>
          <ul>
            <PropsItem
              icon={<ClipIcon width={13} />}
              title="Attachments:"
              subtitle={String(memory?.attachments?.length || 0)}
            />
            <PropsItem
              icon={<TagIcon width={16} />}
              title="Tags:"
              className="!items-start"
              subtitle={
                memory?.tags?.length ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {memory.tags.map((t) => (
                      <span key={t} className="mem-tags text-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  "None"
                )
              }
            />
          </ul>
        </div>
      </div>
    </div>
  );
}
