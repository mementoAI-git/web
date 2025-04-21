
export function TableRowSekeleton() {
  return [1, 2, 3].map(i => (
    <tr key={i} className="animate-pulse">
      <td>
        <div className="flex w-75 cursor-pointer items-center gap-2">
          <div className="h-10 w-[46.87px] bg-gray-200 rounded" />
          <span className="h-3 w-full bg-gray-200 rounded" />
        </div>
      </td>
      <td>
        <div className="h-3 w-full max-w-18 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-gray-200 h-4 w-9" />
          <div className="rounded-full bg-gray-200 h-4 w-9" />
          <div className="rounded-full bg-gray-200 h-4 w-9" />
        </div>
      </td>
    </tr>
  ))
}

export function DetailsSideBarSkeleton() {
  return (
    <div className="size-full animate-pulse space-y-3 bg-[#FCFCFD] p-6">
      {
        [1, 2, 3].map(i => (
          <div key={i} className="space-y-4 border-b border-grey-500 pb-14">
            <div className="h-3 w-full max-w-38 bg-gray-200 rounded" />
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-gray-200" />
                <div className="h-3 w-35 rounded bg-gray-200" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-gray-200" />
                <div className="h-3 w-45 rounded bg-gray-200" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-gray-200" />
                <div className="h-3 w-35 rounded bg-gray-200" />
              </li>
            </ul>
          </div>
        ))
      }
    </div>
  )
}