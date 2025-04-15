import EditIcon from "@/public/icon/edit.svg"
import ImageThumbnail from "@/components/ImageThumbnail"
import { MemoryItemActions } from "./MemoriesDropdown"
import { IMemory, IPagination } from "@/utility/interface"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"

function MemoriesTableRow({ memory }: { memory: IMemory }) {
  const router = useRouter()
  return (
    <tr>
      <td onClick={() => router.push(`/memories/${memory?._id}`)}>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="min-w-[33.53px] w-[46.87px] h-10">
            <ImageThumbnail images={memory?.attachments} size={33.53} />
          </div>
          <span className="text-[#050709] text-sm font-inter font-medium max-w-75 whitespace-nowrap truncate"> {memory.title}</span>
        </div>
      </td>
      <td className="text-[#535862] text-sm">{dayjs(memory.created_at).format("MMM DD, YYYY")}</td>
      <td>
        <div className="flex items-center gap-1">
          <span className="mem-tags !bg-[#EFF8FF] !border-[#B2DDFF] !text-[#175CD3]">travel</span>
          <span className="mem-tags !bg-[#EEF4FF] !border-[#C7D7FE] !text-[#3538CD]">family</span>
          <span className="mem-tags !bg-[#EEF4FF] !border-[#C7D7FE] !text-[#3538CD]">life</span>
          <span className="mem-tags">+4</span>
        </div>
      </td>
      <td className="w-fit">
        <div className="flex items-center gap-4 text-[#949494] justify-end">
          <EditIcon />
          <MemoryItemActions />
        </div>
      </td>
    </tr>
  )
}

export default function MemoriesTable({ data }: { data: IPagination<IMemory> }) {
  return (
    <div className="border rounded-xl w-full h-fit bg-white border-[rgba(233,234,235,1)] shadow-sm shadow-[rgba(10,13,18,0.05)] mem-table">
      <table className="w-full h-full text-left">
        <thead className="capitalize font-inter font-semibold text-xs text-[rgba(113,118,128,1)]">
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
      <div className="flex font-inter text-sm w-full text-[rgba(65,70,81,1)] border-[rgba(213,215,218,1)] py-3 px-6 justify-between items-center">
        <button disabled={data?.hasPrevPage} className="cursor-pointer font-semibold rounded-lg bg-white border border-inherit px-3 py-2 max-h-9 flex items-center justify-center shadow-sm">
          Previous
        </button>
        <span className="font-medium">Page {data?.page || 0} of {data?.totalPages || 1}</span>
        <button disabled={data?.hasNextPage} className="cursor-pointer font-semibold rounded-lg bg-white border border-inherit px-3 py-2 max-h-9 flex items-center justify-center shadow-sm">
          Next
        </button>
      </div>
    </div>
  )
}
