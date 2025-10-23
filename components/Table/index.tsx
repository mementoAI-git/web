import { cn, isEmpty } from "@/utility"
import { IPagination } from "@/utility/interface"
import TableRowSekeleton from "./RowSekeleton"

interface IColumn {
  label: string
  className?: string
}
interface ITable<T> {
  data: IPagination<T>
  loading?: boolean
  columns: IColumn[]
  onChangePage?: (page: number) => void;
  loadingRow?: React.ReactNode;
  emptyRow?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  renderRow?: (item: T, i: number) => React.ReactNode
}

export default function Table<T>({
  data,
  columns,
  renderRow,
  onChangePage,
  loadingRow = null,
  loading = false,
  className = "",
  headerClassName = ""
}: ITable<T>) {
  const handleOnNextPage = () => {
    if (!data.hasNextPage) return;
    onChangePage(data.nextPage)
  }

  const handleOnPrevPage = () => {
    if (!data.hasPrevPage) return;
    onChangePage(data.prevPage)
  }
  return (
    <div className={cn("mem-table h-fit w-full rounded-xl border border-[rgba(233,234,235,1)] bg-white shadow-sm shadow-[rgba(10,13,18,0.05)]", className)}>
      {/* TODO: fixed the overflow problem it's causing issues like dropdowns not properly displayed */}
      <div className=" overflow-y-visible overflow-x-auto hide-scrollbar">
        <table className="min-w-[600px]  w-full text-left text-xs sm:text-sm">
          <thead className={cn("font-inter text-xs sm:text-sm font-semibold text-[rgba(113,118,128,1)] capitalize", headerClassName)}>
            <tr>
              {columns.map((c, i) => <th className={cn("whitespace-nowrap", c.className)} key={i}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="border-y border-[rgba(233,234,235,1)] text-xs sm:text-sm text-[#535862]">
            {
              loading || isEmpty(data) ?
                (loadingRow || <TableRowSekeleton col={columns.length} />) :
                data?.docs?.map((row, i) => renderRow(row, i))
            }
          </tbody>
        </table>
      </div>
      <div className="flex w-full flex-row gap-2 sm:gap-0 items-center justify-between border-t-0 border-[rgba(213,215,218,1)] px-3 sm:px-6 py-3 font-inter text-xs sm:text-sm text-[rgba(65,70,81,1)] bg-white">
        <button
          disabled={!data?.hasPrevPage}
          onClick={handleOnPrevPage}
          className="flex max-h-9 cursor-pointer disabled:cursor-not-allowed items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm disabled:opacity-65 text-xs sm:text-sm"
        >
          Previous
        </button>
        <span className="font-medium">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <button
          disabled={!data?.hasNextPage}
          onClick={handleOnNextPage}
          className="flex max-h-9 cursor-pointer disabled:cursor-not-allowed items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm disabled:opacity-65 text-xs sm:text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}