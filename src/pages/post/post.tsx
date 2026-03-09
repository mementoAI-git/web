import dayjs from "dayjs";
import DOMPurify from "isomorphic-dompurify";
import FileGallery from "@/components/file-gallery";
import PropsItem from "@/components/props-item";
import { Calendar1Icon, ClipIcon, TagIcon } from "@/components/icons";
import { ensureLinksOpenInNewTab, isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";

export default function Post({ memory }: { memory: IMemory }) {
  return (
    <div className="w-full space-y-10">
      <div className="space-y-3">
        <h3 className="font-garamond text-xl font-medium leading-tight text-[#101828] sm:text-2xl md:text-3xl lg:text-[40px] lg:leading-[48px]">
          {memory?.title}
        </h3>
        <div className="rounded-xl border border-grey-500 p-3">
          <div className="flex flex-wrap gap-12">
            <PropsItem
              icon={<Calendar1Icon width={13} />}
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
                  {memory.tags.map((tag) => (
                    <span key={tag} className="mem-tags mr-1">
                      {tag}
                    </span>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </div>
      {!isEmpty(memory?.attachments) && <FileGallery files={memory?.attachments || []} />}
      <div className="tiptap-editor">
        <div
          className="tiptap-editor mt-4 font-inter text-sm leading-relaxed text-grey-600 sm:mt-6 sm:text-base"
          dangerouslySetInnerHTML={{ __html: ensureLinksOpenInNewTab(DOMPurify.sanitize(memory?.body || "")) }}
        />
      </div>
    </div>
  );
}

