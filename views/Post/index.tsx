import FileGallery from "@/components/FileGallery";
import PropsItem from "@/components/PropsItem";

import CalenderIcon from "@/public/icon/calendar-1.svg";
import ClipIcon from "@/public/icon/clip.svg";
import TagIcon from "@/public/icon/tag.svg";
import { IMemory } from "@/utility/interface";

import dayjs from "dayjs";

export default function Post({ memory }: { memory: IMemory }) {
  return (
    <div className="w-full space-y-10">
      <div className="space-y-3">
        <h3 className="font-medium font-bricolage text-6xl text-secondary">My travel experiences - 2024</h3>
        <div className="flex flex-col gap-3 p-3 border border-grey-500 rounded-xl">
          <div className="flex flex-wrap gap-12">
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
              icon={<ClipIcon width={13} />}
              title="attachment:"
              subtitle={<span className="mem-tags">{memory.attachments.length || 0}</span>}
            />
          </div>
          <PropsItem
            icon={<TagIcon width={13} />}
            title="Tags:"
            subtitle={
              <div>
                {memory.tags.map(t => <span key={t} className="mem-tags">{t}</span>)}
              </div>
            }
          />
        </div>
      </div>
      <FileGallery files={memory?.attachments || []} />
      <div className="font-inter text-sm text-grey-600">
        <span>{memory?.body}</span>
      </div>
    </div>
  )
}