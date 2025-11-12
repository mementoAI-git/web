import ImageThumbnail from "@/components/image-thumbnail";
import { MemoryItemActions } from "./dropdown";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { tagColors } from "@/utility/constant";
import { isEmpty } from "@/utility";
import { DocsClipIcon } from "@/components/icons";
import type { IMemory } from "@/utility/interface";

export default function StoriesTableRow({ memory }: { memory: IMemory }) {
  const navigate = useNavigate();
  return (
    <tr>
      <td onClick={() => navigate(`/stories/${memory?._id}`)}>
        <div className="flex cursor-pointer items-center gap-2">
          <div className="h-10 flex items-center justify-center w-[46.87px] min-w-[33.53px]">
            {
              isEmpty(memory?.attachments) ?
                <div className="size-[33.53px] rounded-[5.83px] justify-center items-center flex bg-grey-500">
                  <DocsClipIcon width={17} />
                </div> :
                <ImageThumbnail images={memory?.attachments} size={33.53} />
            }
          </div>
          <span className="max-w-75 truncate font-inter text-sm font-medium whitespace-nowrap text-[#050709]">
            {" "}
            {memory.title}
          </span>
        </div>
      </td>
      <td className="text-sm whitespace-nowrap text-[#535862]">
        {dayjs(memory.created_at).format("MMM DD, YYYY")}
      </td>
      <td>
        <div className="flex items-center gap-1">
          {
            memory.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`mem-tags whitespace-nowrap truncate-ellipsis ${tagColors[tag] || ""} `}>
                {tag}
              </span>
            ))
          }
          {
            memory.tags.length > 3 &&
            <span className="mem-tags">+{memory.tags.length - 3}</span>
          }
        </div>
      </td>
      <td className="w-fit">
        <MemoryItemActions memory={memory} />
      </td>
    </tr>
  );
}