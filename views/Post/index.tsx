import FileGallery from "@/components/FileGallery";
import PropsItem from "@/components/PropsItem";

import CalenderIcon from "@/public/icon/calendar-1.svg";
import ClipIcon from "@/public/icon/clip.svg";
import TagIcon from "@/public/icon/tag.svg";
import { isEmpty } from "@/utility";
import { IMemory } from "@/utility/interface";
import DOMPurify from "isomorphic-dompurify";
import dayjs from "dayjs";

export default function Post({ memory }: { memory: IMemory }) {
  return (
    <div className="w-full space-y-10">
      <div className="space-y-3">
        <h3 className="font-garamond text-xl sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px] font-medium text-[#101828] leading-tight">
          {memory?.title}
        </h3>
        <div className="flex flex-col gap-3 p-3 border border-grey-500 rounded-xl">
          <div className="flex flex-wrap gap-12">
            <PropsItem
              icon={<CalenderIcon width={13} />}
              title="created:"
              subtitle={dayjs(memory.created_at).format("MMM DD, YYYY")}
            />
            <PropsItem
              icon={<ClipIcon width={13} />}
              title="attachment:"
              subtitle={<span className="mem-tags">{memory.attachments.length || 0}</span>}
            />
            <PropsItem
              icon={<TagIcon width={13} />}
              title="Tags:"
              subtitle={
                <div>
                  {memory.tags.map(t => <span key={t} className="mem-tags mr-1">{t}</span>)}
                </div>
              }
            />
          </div>
        </div>
      </div>
      {
        !isEmpty(memory?.attachments) &&
        <FileGallery files={memory?.attachments || []} />
      }
      <div className="tiptap-editor">
        <div
          className="font-inter text-sm sm:text-base text-grey-600 mt-4 sm:mt-6 leading-relaxed tiptap-editor"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(memory?.body || "") }}
        />
      </div>
    </div>
  )
}