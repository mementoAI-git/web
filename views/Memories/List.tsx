import VeriticalElipseIcon from "@/public/icon/vertical-ellipse.svg"
import EditIcon from "@/public/icon/edit.svg"

export default function MemoriesList() {
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
              <div className="flex items-center">
                <div>
                  <div className="relative ">
                    <div className="w-[33.53px] absolute bg-red-50 z-30 top-0 left-0 aspect-square border rounded-[5.83px]"></div>
                    <div className="w-[33.53px] absolute bg-red-200 z-20 top-0 left-0 aspect-square border rounded-[5.83px]"></div>
                    <div className="w-[33.53px] absolute bg-red-400 z-10 top-0 left-0 aspect-square border rounded-[5.83px]"></div>
                  </div>
                </div>
                <span className="text-[#050709] text-sm font-inter font-medium">My travel experiences 2024</span>
              </div>
            </td>
            <td className="text-[#535862] text-sm">Jan 18, 2025</td>
            <td>Tags</td>
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
