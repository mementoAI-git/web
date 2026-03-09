import type { ReactNode } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { ModalCloseBtn } from "../modalLayout";
import PropsItem from "@/components/props-item";
import endpoint from "@/api/endpoint";
import type { IMemory } from "@/utility/interface";
import { getPostTypeLabel } from "@/utility/memory";
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

function formatUserAccess(memory: IMemory | undefined): ReactNode {
  const groups = memory?.groups ?? [];
  const beneficiaries = memory?.beneficiaries ?? [];
  const items = [...groups.map((g) => ({ name: g.name, type: "group" as const })), ...beneficiaries.map((b) => ({ name: b.name, type: "beneficiary" as const }))];

  if (items.length === 0) return "None";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={`${item.type}-${i}`} className="mem-tags text-xs">
          {item.name}
          {item.type === "group" && (
            <span className="ml-0.5 text-[10px] text-gray-400">(group)</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function ViewMemoryDetails({ data: { memory: initialMemory } }: ViewMemoryDetailsProps) {
  const { close } = useModal();

  const { data: fetched } = useSWR(
    initialMemory?._id ? `${endpoint.memories}/${initialMemory._id}` : null
  );
  const memory = (fetched?.data as IMemory) ?? initialMemory;

  return (
    <div
      className="modal-container !max-w-md !p-5 !h-fit"
      onClick={(e) => e.stopPropagation()}
    >
      <ModalCloseBtn onClick={() => close("view-memory-details")} />
      <div className="space-y-6">
        <div className="space-y-1">
          <h4 className="modal-title">Story Details</h4>
          <p className="font-inter text-sm text-gray-500 truncate border-b border-gray-100 pb-3">
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
              subtitle={getPostTypeLabel(memory)}
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
              title="User access:"
              className="!items-start"
              subtitle={formatUserAccess(memory)}
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
