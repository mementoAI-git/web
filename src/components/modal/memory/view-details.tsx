import type { ReactNode } from "react";
import useSWR from "swr";
import { useModal } from "@/hooks/use-modal";
import { ModalCloseBtn } from "../modalLayout";
import PropsItem from "@/components/props-item";
import endpoint from "@/api/endpoint";
import type { IMemory, IMemoryAccessItem } from "@/utility/interface";
import { GROUP_COLORS } from "@/utility/constant";
import dayjs from "dayjs";
import {
  FolderIcon,
  Calendar1Icon,
  LockIcon,
  ClipIcon,
  TagIcon,
} from "@/components/icons";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

interface ViewMemoryDetailsProps {
  data: { memory: IMemory };
}

function getGroupColorClass(item: IMemoryAccessItem): string {
  const idx = item.color ?? 0;
  return GROUP_COLORS[Math.min(idx, GROUP_COLORS.length - 1)];
}

function formatUserAccess(memory: IMemory | undefined): ReactNode {
  const groups = memory?.groups ?? [];
  const beneficiaries = memory?.beneficiaries ?? [];
  const groupItems = groups.map((g) => ({ ...g, type: "group" as const }));
  const beneficiaryItems = beneficiaries.map((b) => ({ ...b, type: "beneficiary" as const }));
  const items = [...groupItems, ...beneficiaryItems];

  if (items.length === 0) return "None";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item.type}-${i}`}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full border font-inter text-xs font-medium ${item.type === "group" ? getGroupColorClass(item) : "bg-blue-50 text-blue-600 border-blue-100"}`}
        >
          @{item.name}
          {item.type === "group" && (
            <span className="ml-0.5 text-[10px] text-gray-400">(group)</span>
          )}
        </span>
      ))}
    </div>
  );
}

function getStoryType(memory: IMemory | undefined): string {
  const type = memory?.type?.toLowerCase();
  if (type === "prompt") return "Daily prompt";
  if (memory?.capture_source === "quick") return "Quick capture";
  return "Journal";
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
          <TypographyH2 className="modal-title">Story Details</TypographyH2>
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-5">
          <TypographyMuted className="block text-xs uppercase tracking-wide text-gray-400">
            Properties
          </TypographyMuted>
          <ul>
            <PropsItem
              icon={<FolderIcon width={16} />}
              title="Story type:"
              subtitle={getStoryType(memory)}
            />
            <PropsItem
              icon={<Calendar1Icon width={13} />}
              title="Created:"
              subtitle={dayjs(memory?.created_at).format("MMM DD, YYYY")}
            />
            <PropsItem
              icon={<Calendar1Icon width={13} />}
              title="Time:"
              subtitle={dayjs(memory?.created_at).format("hh:mm A")}
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
          <TypographyMuted className="block text-xs uppercase tracking-wide text-gray-400">
            Stats
          </TypographyMuted>
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
