import EditIcon from "@/public/icon/edit.svg";
import ImageThumbnail from "@/components/ImageThumbnail";
import { MemoryItemActions } from "./MemoriesDropdown";
import { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

function MemoriesTableRow({ memory }: { memory: IMemory }) {
  const router = useRouter();
  return (
    <tr>
      <td onClick={() => router.push(`/memories/${memory?._id}`)}>
        <div className="flex cursor-pointer items-center gap-2">
          <div className="h-10 w-[46.87px] min-w-[33.53px]">
            <ImageThumbnail images={memory?.attachments} size={33.53} />
          </div>
          <span className="max-w-75 truncate font-inter text-sm font-medium whitespace-nowrap text-[#050709]">
            {" "}
            {memory.title}
          </span>
        </div>
      </td>
      <td className="text-sm text-[#535862]">
        {dayjs(memory.created_at).format("MMM DD, YYYY")}
      </td>
      <td>
        <div className="flex items-center gap-1">
          <span className="mem-tags !border-[#B2DDFF] !bg-[#EFF8FF] !text-[#175CD3]">
            travel
          </span>
          <span className="mem-tags !border-[#C7D7FE] !bg-[#EEF4FF] !text-[#3538CD]">
            family
          </span>
          <span className="mem-tags !border-[#C7D7FE] !bg-[#EEF4FF] !text-[#3538CD]">
            life
          </span>
          <span className="mem-tags">+4</span>
        </div>
      </td>
      <td className="w-fit">
        <div className="flex items-center justify-end gap-4 text-[#949494]">
          <EditIcon />
          <MemoryItemActions />
        </div>
      </td>
    </tr>
  );
}

export default function MemoriesTable({
  data,
}: {
  data: IPagination<IMemory>;
}) {
  return (
    <div className="mem-table h-fit w-full rounded-xl border border-[rgba(233,234,235,1)] bg-white shadow-sm shadow-[rgba(10,13,18,0.05)]">
      <table className="h-full w-full text-left">
        <thead className="font-inter text-xs font-semibold text-[rgba(113,118,128,1)] capitalize">
          <tr>
            <th>Topic</th>
            <th>Date created</th>
            <th>Tags</th>
            <th />
          </tr>
        </thead>
        <tbody className="border-y border-inherit">
          {data?.docs.map((m, i) => <MemoriesTableRow key={i} memory={m} />)}
        </tbody>
      </table>
      <div className="flex w-full items-center justify-between border-[rgba(213,215,218,1)] px-6 py-3 font-inter text-sm text-[rgba(65,70,81,1)]">
        <button
          disabled={data?.hasPrevPage}
          className="flex max-h-9 cursor-pointer items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm"
        >
          Previous
        </button>
        <span className="font-medium">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <button
          disabled={data?.hasNextPage}
          className="flex max-h-9 cursor-pointer items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
