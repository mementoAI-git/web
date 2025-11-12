import { cn, isEmpty } from "@/utility";
import type { IPagination } from "@/utility/interface";
import TableRowSkeleton from "./row-skeleton";

interface Column {
  label: string;
  className?: string;
}

interface TableProps<T> {
  data: IPagination<T>;
  loading?: boolean;
  columns: Column[];
  onChangePage?: (page: number) => void;
  loadingRow?: React.ReactNode;
  emptyRow?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  renderRow: (item: T, index: number) => React.ReactNode;
}

export default function Table<T>({
  data,
  columns,
  renderRow,
  onChangePage,
  loadingRow = null,
  loading = false,
  className = "",
  headerClassName = "",
}: TableProps<T>) {
  const handleNext = () => {
    if (!data?.hasNextPage || !onChangePage) return;
    onChangePage(data.nextPage);
  };

  const handlePrev = () => {
    if (!data?.hasPrevPage || !onChangePage) return;
    onChangePage(data.prevPage);
  };

  return (
    <div className={cn("mem-table h-fit w-full rounded-xl border border-[rgba(233,234,235,1)] bg-white shadow-sm shadow-[rgba(10,13,18,0.05)]", className)}>
      <div className="hide-scrollbar overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
          <thead className={cn("font-inter text-xs font-semibold capitalize text-[rgba(113,118,128,1)] sm:text-sm", headerClassName)}>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={cn("whitespace-nowrap", column.className)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border-y border-[rgba(233,234,235,1)] text-xs text-[#535862] sm:text-sm">
            {loading || isEmpty(data)
              ? loadingRow || <TableRowSkeleton col={columns.length} />
              : data?.docs?.map((row, index) => renderRow(row, index))}
          </tbody>
        </table>
      </div>
      <div className="flex w-full flex-row items-center justify-between gap-2 border-t-0 border-[rgba(213,215,218,1)] bg-white px-3 py-3 font-inter text-xs text-[rgba(65,70,81,1)] sm:gap-0 sm:px-6 sm:text-sm">
        <button
          type="button"
          disabled={!data?.hasPrevPage}
          onClick={handlePrev}
          className="flex max-h-9 items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-65 sm:text-sm"
        >
          Previous
        </button>
        <span className="font-medium">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!data?.hasNextPage}
          onClick={handleNext}
          className="flex max-h-9 items-center justify-center rounded-lg border border-inherit bg-white px-3 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-65 sm:text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

