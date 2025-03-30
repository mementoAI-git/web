import SearchIcon from "@/public/icon/dashboard/search.svg"

export function Searchinput() {
  return (
    <div className="rounded-lg border h-full flex-1 flex items-center gap-2 py-2 px-[14px] border-[rgba(208,213,221,1)]">
      <SearchIcon />
      <input placeholder="Search" className="outline-0 flex-1" />
    </div>
  )
}