export function TableRowSekeleton() {
  return [1, 2, 3].map(i => (
    <tr key={i} className="animate-pulse">
      <td>
        <div className="flex w-75 cursor-pointer items-center gap-2 px-4 py-3">
          <div className="h-10 w-[46.87px] bg-v3-fill-weaker rounded" />
          <div className="w-full space-y-2">
            <div className="h-3 w-full bg-v3-fill-weaker rounded" />
            <div className="h-3 w-full max-w-18 bg-v3-fill-weaker rounded" />
          </div>
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
          <div key={i} className="space-y-4 border-b border-v3-stroke-weak pb-14">
            <div className="h-3 w-full max-w-38 bg-v3-fill-weaker rounded" />
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-v3-fill-weaker" />
                <div className="h-3 w-35 rounded bg-v3-fill-weaker" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-v3-fill-weaker" />
                <div className="h-3 w-45 rounded bg-v3-fill-weaker" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-v3-fill-weaker" />
                <div className="h-3 w-20 rounded bg-v3-fill-weaker" />
              </li>
              <li className="flex items-center gap-2">
                <div className="size-5 rounded bg-v3-fill-weaker" />
                <div className="h-3 w-35 rounded bg-v3-fill-weaker" />
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
        <div className="w-[50%] h-7 rounded bg-v3-fill-weaker" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-50 bg-v3-fill-weaker w-[20%] shrink-0 rounded" />
        <div className="h-50 bg-v3-fill-weaker w-[30%] rounded" />
        <div className="h-50 bg-v3-fill-weaker grow shrink-0 rounded" />
        <div className="h-50 bg-v3-fill-weaker w-1/4 rounded" />
        <div className="h-50 bg-v3-fill-weaker w-[40%] shrink-0 rounded" />
        <div className="h-50 bg-v3-fill-weaker w-[30%] shrink-0 rounded" />
      </div>
      <div className="bg-v3-fill-weaker w-full h-100 rounded"></div>
    </div>
  )
}
