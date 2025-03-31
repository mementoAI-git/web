import VeriticalElipseIcon from "@/public/icon/vertical-ellipse.svg"
import EditIcon from "@/public/icon/edit.svg"
import ImageThumbnail from "@/components/ImageThumbnail"

export default function MemoriesTable() {
  return (
    <div className="border rounded-xl w-full h-fit bg-white border-[rgba(233,234,235,1)] shadow-sm shadow-[rgba(10,13,18,0.05)] mem-table">
      <table className="w-full h-full text-left">
        <thead className="capitalize font-inter font-semibold text-xs text-[rgba(113,118,128,1)]">
          <th>Topic</th>
          <th>Date created</th>
          <th>Tags</th>
          <th />
        </thead>
        <tbody className="border-y border-inherit">
          <tr>
            <td>
              <div className="flex items-center gap-2">
                <div className="min-w-[33.53px] w-[46.87px] h-10">
                  <ImageThumbnail size={33.53} />
                </div>
                <span className="text-[#050709] text-sm font-inter font-medium">My travel experiences 2024</span>
              </div>
            </td>
            <td className="text-[#535862] text-sm">Jan 18, 2025</td>
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
                <VeriticalElipseIcon />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex font-inter text-sm w-full text-[rgba(65,70,81,1)] border-[rgba(213,215,218,1)] py-3 px-6 justify-between items-center">
        <button className="cursor-pointer font-semibold rounded-lg bg-white border border-inherit px-3 py-2 max-h-9 flex items-center justify-center shadow-sm">
          Previous
        </button>
        <span className="font-medium">Page 1 of 10</span>
        <button className="cursor-pointer font-semibold rounded-lg bg-white border border-inherit px-3 py-2 max-h-9 flex items-center justify-center shadow-sm">
          Next
        </button>
      </div>
    </div>
  )
}
