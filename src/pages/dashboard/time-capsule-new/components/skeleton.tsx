
export function TableRowSekeleton() {
  return [1, 2, 3].map(i => (
    <tr key={i} className="animate-pulse">
      <td>
        <div className="flex w-75 cursor-pointer items-center gap-2">
          <div className="h-10 w-[46.87px] bg-sand-3 rounded" />
          <span className="h-3 w-full bg-sand-3 rounded" />
        </div>
      </td>
      <td>
        <div className="h-3 w-full max-w-18 bg-sand-3 rounded" />
      </td>
      <td>
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-sand-3 h-4 w-9" />
          <div className="rounded-full bg-sand-3 h-4 w-9" />
          <div className="rounded-full bg-sand-3 h-4 w-9" />
        </div>
      </td>
    </tr>
  ))
}

export function DetailsSideBarSkeleton() {
  return (
    <div className="size-full animate-pulse space-y-3 bg-white p-6">
      {
        [1, 2, 3].map(i => (
          <div key={i} className="space-y-4 border-b border-grey-500 pb-14">
            <div className="h-3 w-full max-w-38 bg-sand-3 rounded" />
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-sand-3" />
                <div className="h-3 w-35 rounded bg-sand-3" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-sand-3" />
                <div className="h-3 w-45 rounded bg-sand-3" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-sand-3" />
                <div className="h-3 w-20 rounded bg-sand-3" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-sand-3" />
                <div className="h-3 w-35 rounded bg-sand-3" />
              </li>
            </ul>
          </div>
        ))
      }
    </div>
  )
}

export function DetailsSkeleton() {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-3">
        <div className="w-[50%] h-7 rounded bg-sand-3" />
        {/* <div className="w-full bg-sand-3 h-20 rounded-xl" /> */}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-50 bg-sand-3 w-[20%] shrink-0  rounded" />
        <div className="h-50 bg-sand-3 w-[30%] rounded" />
        <div className="h-50 bg-sand-3 grow shrink-0 rounded" />
        <div className="h-50 bg-sand-3 w-1/4 rounded" />
        <div className="h-50 bg-sand-3 w-[40%] shrink-0 rounded" />
        <div className="h-50 bg-sand-3 w-[30%] shrink-0 rounded" />
      </div>
      <div className="bg-sand-3 w-full h-100 rounded"></div>
    </div>
  )
}