import { isEmpty } from "@/utility"
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
  onPrevPage?: () => void;
  onNextPage?: () => void;
  renderRow?: (item: T) => React.ReactNode
}

export default function Table<T>({ data, columns, renderRow, onPrevPage, onNextPage, loading = false }: ITable<T>) {
  return (
    <div className="mem-table h-fit w-full rounded-xl border border-[rgba(233,234,235,1)] bg-white shadow-sm shadow-[rgba(10,13,18,0.05)]">
      <table className="h-full w-full text-left">
        <thead className="font-inter text-xs font-semibold text-[rgba(113,118,128,1)] capitalize">
          <tr>
            {columns.map((c, i) => <th className={c.className} key={i}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="border-y border-inherit text-sm text-[#535862]">
          {
            loading || isEmpty(data) ?
              <TableRowSekeleton col={columns.length} /> :
              data?.docs.map((row, i) => renderRow(row))
          }
        </tbody>
      </table>
      <div className="flex w-full items-center justify-between border-[rgba(213,215,218,1)] px-6 py-3 font-inter text-sm text-[rgba(65,70,81,1)]">
        <button
          disabled={data?.hasPrevPage}
          onClick={onPrevPage}
          className="flex max-h-9 cursor-pointer items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm"
        >
          Previous
        </button>
        <span className="font-medium">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <button
          disabled={data?.hasNextPage}
          onClick={onNextPage}
          className="flex max-h-9 cursor-pointer items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 font-semibold shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}