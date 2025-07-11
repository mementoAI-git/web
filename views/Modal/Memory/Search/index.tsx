import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import SearchIcon from "@/public/icon/dashboard/search.svg";
import ArrowRightIcon from "@/public/icon/arrow-right.svg"
import { useEffect, useState } from "react";
import { getRecentMemories, isEmpty } from "@/utility";
import SearchItem from "./SearchItem";
import EmptyRecentMemories from "./EmptyRecentMemories";
import { useStore } from "@/hooks/use-store";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";

export function SearchMemories() {
  const { close } = useModal();
  const { user } = useStore();
  const [recentMemories, setRecentMemories] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const recent = getRecentMemories(user.email);
    setRecentMemories(recent);
  }, [user.email]);

  const url = `${endpoint.memories}?search=${encodeURIComponent(search.trim())}`

  const { data: searchData, isLoading } = useSWR(search.trim() ? url : null);
  const searchResults = searchData?.data?.docs || [];

  const showRecent = !search.trim();
  const showEmpty = search.trim() ? (!isLoading && isEmpty(searchResults)) : isEmpty(recentMemories);

  return (
    <div className="modal-container !max-w-200">
      <ModalCloseBtn onClick={() => close("search-memory")} />
      <div className="space-y-6">
        <h4 className="text-2xl font-semibold font-inter text-secondary">Search Memento</h4>
        <div className="flex h-full flex-1 items-center gap-2 rounded-full border border-[rgba(208,213,221,1)] px-[14px] py-2">
          <SearchIcon />
          <input
            placeholder="Search"
            className="flex-1 outline-0"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {
            isLoading ?
              <Spinner loading className="!size-6 !text-black shrink-0" /> :
              <div className="bg-secondary cursor-pointer flex justify-center items-center text-white rounded-full size-6">
                <ArrowRightIcon width={11} />
              </div>
          }
        </div>
        {showEmpty ?
          <EmptyRecentMemories />
          : showRecent ?
            <div className="space-y-3">
              <span className="font-inter inline-block font-semibold text-sm text-secondary">Recently opened posts:</span>
              <div className="space-y-2">
                {recentMemories.map((memory, i) => <SearchItem key={i} memory={memory} />)}
              </div>
            </div> :
            <div className="space-y-3">
              <span className="font-inter inline-block font-semibold text-sm text-secondary">Search results:</span>
              <div className="space-y-2">
                {searchResults.map((memory, i) => <SearchItem key={i} memory={memory} />)}
              </div>
            </div>
        }
      </div>
    </div>
  );
}