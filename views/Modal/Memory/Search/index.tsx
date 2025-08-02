import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import SearchIcon from "@/public/icon/dashboard/search.svg";
import ArrowRightIcon from "@/public/icon/arrow-right.svg"
import React, { useEffect, useState, useMemo } from "react";
import { getRecentMemories, isEmpty } from "@/utility";
import SearchItem from "./SearchItem";
import EmptyRecentMemories from "./EmptyRecentMemories";
import { useStore } from "@/hooks/use-store";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/Spinner";
import { SkeletonLoader } from "./Loader";

export function SearchMemories() {
  const { close } = useModal();
  const { user } = useStore();
  const [recentMemories, setRecentMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const recent = getRecentMemories(user.email);
    setRecentMemories(recent);
  }, [user.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 100);

    return () => clearTimeout(timer);
  }, [search]);

  const url = `${endpoint.memories}?search=${encodeURIComponent(debouncedSearch.trim())}`;

  const { data: searchData, isLoading } = useSWR(debouncedSearch.trim() ? url : null);
  const searchResults = searchData?.data?.docs || [];

  const showRecent = !debouncedSearch.trim();
  const showEmpty = debouncedSearch.trim() ? (!isLoading && isEmpty(searchResults)) : isEmpty(recentMemories);

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
        <div className="transition-all max-h-60 sm:max-h-80 md:max-h-96 hide-scrollbar overflow-y-auto duration-300 ease-in-out">
          {showEmpty ? (
            <div className="animate-fadeIn">
              <EmptyRecentMemories />
            </div>
          ) : showRecent ? (
            <div className="space-y-3 animate-fadeIn">
              <span className="font-inter inline-block font-semibold text-sm text-secondary">Recently opened posts:</span>
              <div className="space-y-2">
                {recentMemories.map((memory, i) => (
                  <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                    <SearchItem memory={memory} searchTerm="" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-fadeIn">
              <span className="font-inter inline-block font-semibold text-sm text-secondary">Search results:</span>
              {
                isLoading ?
                  <React.Fragment>
                    {
                      Array(2).fill(0).map((_, i) => (
                        <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                          <SkeletonLoader />
                        </div>
                      ))
                    }
                  </React.Fragment> :
                  <div className="space-y-2">
                    {searchResults.map((memory, i) => (
                      <div key={i} className="animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
                        <SearchItem memory={memory} searchTerm={debouncedSearch.trim()} />
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}