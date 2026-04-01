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

const defaultEmptyRow = (colSpan: number) => (
  <tr>
    <td colSpan={colSpan} className="py-12 text-center">
      <p className="font-inter text-sm text-v3-text-weak">No data yet</p>
    </td>
  </tr>
);

export default function Table<T>({
  data,
  columns,
  renderRow,
  onChangePage,
  loadingRow = null,
  emptyRow = null,
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

  const hasNoDocs = !data?.docs?.length;
  const showEmpty = !loading && !isEmpty(data) && hasNoDocs;

  return (
    <div className={cn("mem-table h-fit w-full rounded-xl border border-v3-stroke-weak bg-white shadow-sm", className)}>
      <div className="hide-scrollbar overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
          <thead className={cn("font-inter text-xs font-semibold capitalize text-v3-text-weaker sm:text-sm", headerClassName)}>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={cn("whitespace-nowrap px-4 py-3", column.className)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border-y border-v3-stroke-weak text-xs text-v3-text-weak sm:text-sm">
            {loading || isEmpty(data)
              ? loadingRow || <TableRowSkeleton col={columns.length} />
              : showEmpty
                ? emptyRow || defaultEmptyRow(columns.length)
                : data?.docs?.map((row, index) => renderRow(row, index))}
          </tbody>
        </table>
      </div>
      <div className="flex w-full flex-row items-center justify-between gap-2 border-t border-v3-stroke-weak bg-white px-3 py-3 font-inter text-xs text-v3-text-weak sm:gap-0 sm:px-6 sm:text-sm">
        <button
          type="button"
          disabled={!data?.hasPrevPage}
          onClick={handlePrev}
          className="flex max-h-9 items-center justify-center rounded-lg border border-v3-stroke-weak bg-white px-3 py-2 text-xs font-semibold text-v3-text-strong shadow-sm transition hover:bg-v3-fill-weaker disabled:cursor-not-allowed disabled:opacity-65 sm:text-sm"
        >
          Previous
        </button>
        <span className="font-medium text-v3-text-strong">
          Page {data?.page || 0} of {data?.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={!data?.hasNextPage}
          onClick={handleNext}
          className="flex max-h-9 items-center justify-center rounded-lg border border-v3-stroke-weak bg-white px-3 py-2 text-xs font-semibold text-v3-text-strong shadow-sm transition hover:bg-v3-fill-weaker disabled:cursor-not-allowed disabled:opacity-65 sm:text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

