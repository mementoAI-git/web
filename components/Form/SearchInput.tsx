import SearchIcon from "@/public/icon/dashboard/search.svg";

export function Searchinput() {
  return (
    <div className="flex h-full flex-1 items-center gap-2 rounded-lg border border-[rgba(208,213,221,1)] px-[14px] py-2">
      <SearchIcon />
      <input placeholder="Search" className="flex-1 outline-0" />
    </div>
  );
}
